package com.campus.passportreservation.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.passportreservation.common.BusinessException;
import com.campus.passportreservation.common.PageResponse;
import com.campus.passportreservation.dto.ReservationDtos.CompanionRequest;
import com.campus.passportreservation.dto.ReservationDtos.CompanionResponse;
import com.campus.passportreservation.dto.ReservationDtos.CurrentPassResponse;
import com.campus.passportreservation.dto.ReservationDtos.PassCodeResponse;
import com.campus.passportreservation.dto.ReservationDtos.ReservationCreateRequest;
import com.campus.passportreservation.dto.ReservationDtos.ReservationDetail;
import com.campus.passportreservation.dto.ReservationDtos.ReservationListItem;
import com.campus.passportreservation.dto.ReservationDtos.ReservationQueryRequest;
import com.campus.passportreservation.entity.Companion;
import com.campus.passportreservation.entity.MobileUser;
import com.campus.passportreservation.entity.Reservation;
import com.campus.passportreservation.enums.ApprovalStatus;
import com.campus.passportreservation.enums.PassStatus;
import com.campus.passportreservation.enums.ReservationType;
import com.campus.passportreservation.mapper.CompanionMapper;
import com.campus.passportreservation.mapper.MobileUserMapper;
import com.campus.passportreservation.mapper.ReservationMapper;
import com.campus.passportreservation.security.LoginContext;
import com.campus.passportreservation.util.MaskingUtils;
import com.campus.passportreservation.util.ValidationUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private static final DateTimeFormatter NO_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final ReservationMapper reservationMapper;
    private final CompanionMapper companionMapper;
    private final MobileUserMapper mobileUserMapper;
    private final CryptoService cryptoService;
    private final DictionaryService dictionaryService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    @Transactional
    public ReservationDetail create(ReservationCreateRequest request) {
        Long mobileUserId = LoginContext.requireMobileId();
        validateCreate(request);
        String idHash = cryptoService.queryHash(request.idCard());
        LocalDate visitDate = request.visitTime().toLocalDate();
        Long duplicate = reservationMapper.selectCount(new LambdaQueryWrapper<Reservation>()
                .eq(Reservation::getIdCardHash, idHash)
                .eq(Reservation::getCampusId, request.campusId())
                .between(Reservation::getVisitTime, visitDate.atStartOfDay(), visitDate.atTime(LocalTime.of(23, 59, 59)))
                .in(Reservation::getApprovalStatus, ApprovalStatus.AUTO_APPROVED.name(), ApprovalStatus.PENDING.name(), ApprovalStatus.APPROVED.name()));
        if (duplicate > 0) {
            throw new BusinessException("同一身份证号在同一校区、同一预约日期已有有效预约");
        }

        LocalDateTime now = LocalDateTime.now();
        Reservation reservation = new Reservation();
        reservation.setReservationNo(nextReservationNo(now));
        reservation.setMobileUserId(mobileUserId);
        reservation.setReservationType(request.reservationType());
        reservation.setCampusId(request.campusId());
        reservation.setApplyTime(now);
        reservation.setVisitTime(request.visitTime());
        reservation.setValidStartTime(visitDate.atStartOfDay());
        reservation.setValidEndTime(visitDate.atTime(LocalTime.of(23, 59, 59)));
        reservation.setOrganization(request.organization());
        reservation.setVisitorName(request.visitorName());
        reservation.setIdCardCipher(cryptoService.encrypt(request.idCard()));
        reservation.setIdCardHash(idHash);
        reservation.setPhoneCipher(cryptoService.encrypt(request.phone()));
        reservation.setPhoneHash(cryptoService.queryHash(request.phone()));
        reservation.setTrafficType(request.trafficType());
        reservation.setPlateNo(request.plateNo());
        reservation.setVisitDeptId(request.visitDeptId());
        reservation.setReceptionist(request.receptionist());
        reservation.setVisitReason(request.visitReason());
        reservation.setApprovalStatus(ReservationType.PUBLIC.name().equals(request.reservationType())
                ? ApprovalStatus.AUTO_APPROVED.name()
                : ApprovalStatus.PENDING.name());
        reservation.setCreatedAt(now);
        reservation.setUpdatedAt(now);
        reservation.setDeleted(0);
        reservationMapper.insert(reservation);
        saveCompanions(reservation.getId(), request.companions(), now);
        fillMobileProfile(mobileUserId, request, now);
        auditLogService.record("RESERVATION_CREATE", "reservation", reservation.getId(), "SUCCESS",
                Map.of("reservationType", request.reservationType()));
        return detailForMobile(reservation.getId());
    }

    public PageResponse<ReservationListItem> queryMine(ReservationQueryRequest request) {
        Long mobileUserId = LoginContext.requireMobileId();
        if (!ValidationUtils.isIdCard(request.idCard())) {
            throw new BusinessException("身份证号格式错误");
        }
        if (!ValidationUtils.isPhone(request.phone())) {
            throw new BusinessException("手机号格式错误");
        }
        long page = request.page() == null || request.page() < 1 ? 1 : request.page();
        long size = request.size() == null || request.size() < 1 ? 20 : Math.min(request.size(), 100);
        Page<Reservation> pageRequest = Page.of(page, size);
        Page<Reservation> result = reservationMapper.selectPage(pageRequest, new LambdaQueryWrapper<Reservation>()
                .eq(Reservation::getMobileUserId, mobileUserId)
                .eq(Reservation::getVisitorName, request.name())
                .eq(Reservation::getIdCardHash, cryptoService.queryHash(request.idCard()))
                .eq(Reservation::getPhoneHash, cryptoService.queryHash(request.phone()))
                .orderByDesc(Reservation::getApplyTime));
        return PageResponse.of(result, result.getRecords().stream().map(this::toListItem).toList());
    }

    public PageResponse<ReservationListItem> listMine(Long pageValue, Long sizeValue) {
        Long mobileUserId = LoginContext.requireMobileId();
        long page = pageValue == null || pageValue < 1 ? 1 : pageValue;
        long size = sizeValue == null || sizeValue < 1 ? 20 : Math.min(sizeValue, 100);
        Page<Reservation> pageRequest = Page.of(page, size);
        Page<Reservation> result = reservationMapper.selectPage(pageRequest, new LambdaQueryWrapper<Reservation>()
                .eq(Reservation::getMobileUserId, mobileUserId)
                .orderByDesc(Reservation::getApplyTime));
        return PageResponse.of(result, result.getRecords().stream().map(this::toListItem).toList());
    }

    public ReservationDetail detailForMobile(Long id) {
        Reservation reservation = ownedReservation(id);
        auditLogService.record("RESERVATION_DETAIL", "reservation", id, "SUCCESS", null);
        return toDetail(reservation);
    }

    public PassCodeResponse passCode(Long id) {
        Reservation reservation = ownedReservation(id);
        PassCodeResponse response = toPassCodeResponse(reservation);
        auditLogService.record("PASS_CODE_VIEW", "reservation", id, "SUCCESS", Map.of("passStatus", response.passStatus()));
        return response;
    }

    public CurrentPassResponse currentPassCode() {
        Reservation reservation = currentReservation(LoginContext.requireMobileId());
        if (reservation == null) {
            return null;
        }
        PassCodeResponse passCode = toPassCodeResponse(reservation);
        auditLogService.record("CURRENT_PASS_CODE_VIEW", "reservation", reservation.getId(), "SUCCESS",
                Map.of("passStatus", passCode.passStatus()));
        return new CurrentPassResponse(toDetail(reservation), passCode);
    }

    private PassCodeResponse toPassCodeResponse(Reservation reservation) {
        PassStatus status = passStatus(reservation);
        String statusText = statusText(status, reservation);
        String idCard = cryptoService.decrypt(reservation.getIdCardCipher());
        String phone = cryptoService.decrypt(reservation.getPhoneCipher());
        String payload = payload(reservation, idCard, phone);
        String qr = qrBase64(payload);
        return new PassCodeResponse(reservation.getId(), reservation.getReservationNo(), status.name(), statusText,
                payload, qr, reservation.getValidStartTime(), reservation.getValidEndTime());
    }

    public ReservationDetail toDetail(Reservation reservation) {
        String idCard = cryptoService.decrypt(reservation.getIdCardCipher());
        String phone = cryptoService.decrypt(reservation.getPhoneCipher());
        List<CompanionResponse> companions = companions(reservation.getId()).stream()
                .map(this::toCompanionResponse)
                .toList();
        return new ReservationDetail(
                reservation.getId(),
                reservation.getReservationNo(),
                reservation.getReservationType(),
                reservation.getCampusId(),
                dictionaryService.campusName(reservation.getCampusId()),
                reservation.getApplyTime(),
                reservation.getVisitTime(),
                reservation.getValidStartTime(),
                reservation.getValidEndTime(),
                reservation.getOrganization(),
                reservation.getVisitorName(),
                MaskingUtils.maskIdCard(idCard),
                MaskingUtils.maskPhone(phone),
                reservation.getTrafficType(),
                reservation.getPlateNo(),
                reservation.getVisitDeptId(),
                dictionaryService.deptName(reservation.getVisitDeptId()),
                reservation.getReceptionist(),
                reservation.getVisitReason(),
                reservation.getApprovalStatus(),
                reservation.getRejectReason(),
                passStatus(reservation).name(),
                companions
        );
    }

    public ReservationListItem toListItem(Reservation reservation) {
        String idCard = cryptoService.decrypt(reservation.getIdCardCipher());
        String phone = cryptoService.decrypt(reservation.getPhoneCipher());
        int peopleCount = 1 + companionMapper.selectCount(new LambdaQueryWrapper<Companion>()
                .eq(Companion::getReservationId, reservation.getId())).intValue();
        return new ReservationListItem(
                reservation.getId(),
                reservation.getReservationNo(),
                reservation.getReservationType(),
                reservation.getCampusId(),
                dictionaryService.campusName(reservation.getCampusId()),
                reservation.getApplyTime(),
                reservation.getVisitTime(),
                reservation.getOrganization(),
                reservation.getVisitorName(),
                MaskingUtils.maskIdCard(idCard),
                MaskingUtils.maskPhone(phone),
                reservation.getVisitDeptId(),
                dictionaryService.deptName(reservation.getVisitDeptId()),
                reservation.getReceptionist(),
                reservation.getApprovalStatus(),
                peopleCount
        );
    }

    public PassStatus passStatus(Reservation reservation) {
        if (!ApprovalStatus.AUTO_APPROVED.name().equals(reservation.getApprovalStatus())
                && !ApprovalStatus.APPROVED.name().equals(reservation.getApprovalStatus())) {
            return PassStatus.UNAPPROVED;
        }
        LocalDate today = LocalDate.now();
        LocalDate visitDate = reservation.getVisitTime().toLocalDate();
        if (today.isBefore(visitDate)) {
            return PassStatus.NOT_STARTED;
        }
        if (today.isAfter(visitDate)) {
            return PassStatus.EXPIRED;
        }
        return PassStatus.VALID;
    }

    public List<Companion> companions(Long reservationId) {
        return companionMapper.selectList(new LambdaQueryWrapper<Companion>()
                .eq(Companion::getReservationId, reservationId)
                .orderByAsc(Companion::getId));
    }

    private Reservation ownedReservation(Long id) {
        Reservation reservation = reservationMapper.selectById(id);
        if (reservation == null || !LoginContext.requireMobileId().equals(reservation.getMobileUserId())) {
            throw new BusinessException("预约记录不存在");
        }
        return reservation;
    }

    private Reservation currentReservation(Long mobileUserId) {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        List<Reservation> current = reservationMapper.selectPage(Page.of(1, 1), new LambdaQueryWrapper<Reservation>()
                .eq(Reservation::getMobileUserId, mobileUserId)
                .ge(Reservation::getValidEndTime, todayStart)
                .orderByAsc(Reservation::getVisitTime)
                .orderByDesc(Reservation::getApplyTime)).getRecords();
        if (!current.isEmpty()) {
            return current.get(0);
        }
        List<Reservation> historical = reservationMapper.selectPage(Page.of(1, 1), new LambdaQueryWrapper<Reservation>()
                .eq(Reservation::getMobileUserId, mobileUserId)
                .orderByDesc(Reservation::getVisitTime)
                .orderByDesc(Reservation::getApplyTime)).getRecords();
        return historical.isEmpty() ? null : historical.get(0);
    }

    private void validateCreate(ReservationCreateRequest request) {
        if (!ReservationType.PUBLIC.name().equals(request.reservationType()) && !ReservationType.OFFICIAL.name().equals(request.reservationType())) {
            throw new BusinessException("预约类型错误");
        }
        if (!ValidationUtils.isIdCard(request.idCard())) {
            throw new BusinessException("身份证号格式错误");
        }
        if (!ValidationUtils.isPhone(request.phone())) {
            throw new BusinessException("手机号格式错误");
        }
        LocalDate today = LocalDate.now();
        LocalDate visitDate = request.visitTime().toLocalDate();
        if (visitDate.isBefore(today) || visitDate.isAfter(today.plusDays(6))) {
            throw new BusinessException("仅允许预约申请当天起 7 个自然日内的访问");
        }
        if (ReservationType.OFFICIAL.name().equals(request.reservationType())) {
            if (request.visitDeptId() == null || isBlank(request.receptionist()) || isBlank(request.visitReason())) {
                throw new BusinessException("公务预约需填写访问部门、接待人和来访事由");
            }
            if (request.visitReason().length() < 5 || request.visitReason().length() > 500) {
                throw new BusinessException("来访事由需为 5-500 字");
            }
        }
        if (request.companions() != null) {
            for (CompanionRequest companion : request.companions()) {
                if (!ValidationUtils.isIdCard(companion.idCard()) || !ValidationUtils.isPhone(companion.phone())) {
                    throw new BusinessException("随行人员身份证号或手机号格式错误");
                }
            }
        }
    }

    private void saveCompanions(Long reservationId, List<CompanionRequest> companions, LocalDateTime now) {
        if (companions == null || companions.isEmpty()) {
            return;
        }
        for (CompanionRequest request : companions) {
            Companion companion = new Companion();
            companion.setReservationId(reservationId);
            companion.setName(request.name());
            companion.setIdCardCipher(cryptoService.encrypt(request.idCard()));
            companion.setIdCardHash(cryptoService.queryHash(request.idCard()));
            companion.setPhoneCipher(cryptoService.encrypt(request.phone()));
            companion.setPhoneHash(cryptoService.queryHash(request.phone()));
            companion.setCreatedAt(now);
            companionMapper.insert(companion);
        }
    }

    private void fillMobileProfile(Long mobileUserId, ReservationCreateRequest request, LocalDateTime now) {
        MobileUser user = mobileUserMapper.selectById(mobileUserId);
        if (user == null) {
            return;
        }
        boolean changed = false;
        if (user.getName() == null || user.getName().isBlank()) {
            user.setName(request.visitorName());
            changed = true;
        }
        if (user.getIdCardHash() == null || user.getIdCardHash().isBlank()) {
            user.setIdCardCipher(cryptoService.encrypt(request.idCard()));
            user.setIdCardHash(cryptoService.queryHash(request.idCard()));
            changed = true;
        }
        if (changed) {
            user.setUpdatedAt(now);
            mobileUserMapper.updateById(user);
        }
    }

    private CompanionResponse toCompanionResponse(Companion companion) {
        return new CompanionResponse(companion.getId(), companion.getName(),
                MaskingUtils.maskIdCard(cryptoService.decrypt(companion.getIdCardCipher())),
                MaskingUtils.maskPhone(cryptoService.decrypt(companion.getPhoneCipher())));
    }

    private String payload(Reservation reservation, String idCard, String phone) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("identityType", "MOBILE_USER");
            payload.put("identityId", "MOBILE:" + reservation.getMobileUserId());
            payload.put("name", MaskingUtils.maskName(reservation.getVisitorName()));
            payload.put("idCard", MaskingUtils.maskIdCard(idCard));
            payload.put("phone", MaskingUtils.maskPhone(phone));
            return objectMapper.writeValueAsString(payload);
        } catch (Exception exception) {
            throw new BusinessException(500, "通行码载荷生成失败");
        }
    }

    private String qrBase64(String payload) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(payload, BarcodeFormat.QR_CODE, 280, 280);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", output);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray());
        } catch (Exception exception) {
            throw new BusinessException(500, "二维码生成失败");
        }
    }

    private String statusText(PassStatus status, Reservation reservation) {
        if (status == PassStatus.VALID) {
            return "通行码有效";
        }
        if (status == PassStatus.NOT_STARTED) {
            return "未到预约日期";
        }
        if (status == PassStatus.EXPIRED) {
            return "预约已过期";
        }
        return ApprovalStatus.REJECTED.name().equals(reservation.getApprovalStatus()) ? "审核未通过" : "待审核";
    }

    private String nextReservationNo(LocalDateTime now) {
        int suffix = ThreadLocalRandom.current().nextInt(1000, 10000);
        return "R" + now.format(NO_DATE) + System.currentTimeMillis() % 100000 + suffix;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
