package com.campus.passportreservation.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.passportreservation.common.BusinessException;
import com.campus.passportreservation.common.PageResponse;
import com.campus.passportreservation.dto.ReservationDtos.AdminReservationQuery;
import com.campus.passportreservation.dto.ReservationDtos.ApprovalRequest;
import com.campus.passportreservation.dto.ReservationDtos.ReservationDetail;
import com.campus.passportreservation.dto.ReservationDtos.ReservationListItem;
import com.campus.passportreservation.dto.ReservationDtos.ReservationStatistics;
import com.campus.passportreservation.entity.ApprovalRecord;
import com.campus.passportreservation.entity.Companion;
import com.campus.passportreservation.entity.Reservation;
import com.campus.passportreservation.entity.SysAdmin;
import com.campus.passportreservation.enums.ApprovalStatus;
import com.campus.passportreservation.enums.ReservationType;
import com.campus.passportreservation.enums.RoleCode;
import com.campus.passportreservation.mapper.ApprovalRecordMapper;
import com.campus.passportreservation.mapper.CompanionMapper;
import com.campus.passportreservation.mapper.ReservationMapper;
import com.campus.passportreservation.security.StpInterfaceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminReservationService {

    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("yyyy-MM");

    private final ReservationMapper reservationMapper;
    private final ApprovalRecordMapper approvalRecordMapper;
    private final CompanionMapper companionMapper;
    private final ReservationService reservationService;
    private final AuthService authService;
    private final StpInterfaceImpl stpInterface;
    private final CryptoService cryptoService;
    private final DictionaryService dictionaryService;
    private final AuditLogService auditLogService;

    public PageResponse<ReservationListItem> publicReservations(AdminReservationQuery query) {
        Page<Reservation> page = page(query);
        Page<Reservation> result = reservationMapper.selectPage(page, baseQuery(query)
                .eq(Reservation::getReservationType, ReservationType.PUBLIC.name())
                .orderByDesc(Reservation::getApplyTime));
        auditLogService.record("PUBLIC_RESERVATION_QUERY", "reservation", null, "SUCCESS", query);
        return PageResponse.of(result, result.getRecords().stream().map(reservationService::toListItem).toList());
    }

    public PageResponse<ReservationListItem> officialReservations(AdminReservationQuery query) {
        SysAdmin admin = authService.currentAdmin();
        LambdaQueryWrapper<Reservation> wrapper = baseQuery(query)
                .eq(Reservation::getReservationType, ReservationType.OFFICIAL.name());
        applyOfficialScope(wrapper, admin);
        Page<Reservation> result = reservationMapper.selectPage(page(query), wrapper.orderByDesc(Reservation::getApplyTime));
        auditLogService.record("OFFICIAL_RESERVATION_QUERY", "reservation", null, "SUCCESS", query);
        return PageResponse.of(result, result.getRecords().stream().map(reservationService::toListItem).toList());
    }

    public ReservationDetail detail(Long id) {
        Reservation reservation = reservationMapper.selectById(id);
        if (reservation == null) {
            throw new BusinessException("预约不存在");
        }
        if (ReservationType.OFFICIAL.name().equals(reservation.getReservationType())) {
            ensureOfficialScope(reservation, authService.currentAdmin());
        }
        auditLogService.record("ADMIN_RESERVATION_DETAIL", "reservation", id, "SUCCESS", null);
        return reservationService.toDetail(reservation);
    }

    @Transactional
    public ReservationDetail approve(Long id, ApprovalRequest request) {
        Reservation reservation = reservationMapper.selectById(id);
        if (reservation == null || !ReservationType.OFFICIAL.name().equals(reservation.getReservationType())) {
            throw new BusinessException("公务预约不存在");
        }
        SysAdmin admin = authService.currentAdmin();
        ensureOfficialScope(reservation, admin);
        if (!ApprovalStatus.PENDING.name().equals(reservation.getApprovalStatus())) {
            throw new BusinessException("仅待审核记录可审核");
        }
        if (!ApprovalStatus.APPROVED.name().equals(request.result()) && !ApprovalStatus.REJECTED.name().equals(request.result())) {
            throw new BusinessException("审核结果错误");
        }
        if (ApprovalStatus.REJECTED.name().equals(request.result()) && (request.rejectReason() == null || request.rejectReason().isBlank())) {
            throw new BusinessException("审核拒绝必须填写拒绝原因");
        }
        LocalDateTime now = LocalDateTime.now();
        reservation.setApprovalStatus(request.result());
        reservation.setRejectReason(ApprovalStatus.REJECTED.name().equals(request.result()) ? request.rejectReason() : null);
        reservation.setApprovedBy(admin.getId());
        reservation.setApprovedAt(now);
        reservation.setUpdatedAt(now);
        reservationMapper.updateById(reservation);

        ApprovalRecord record = new ApprovalRecord();
        record.setReservationId(id);
        record.setApproverId(admin.getId());
        record.setApprovalResult(request.result());
        record.setRejectReason(request.rejectReason());
        record.setApprovedAt(now);
        approvalRecordMapper.insert(record);

        auditLogService.record("OFFICIAL_RESERVATION_APPROVAL", "reservation", id, "SUCCESS", request);
        return reservationService.toDetail(reservation);
    }

    public List<ReservationStatistics> statistics(String reservationType, String dimension, AdminReservationQuery query) {
        SysAdmin admin = authService.currentAdmin();
        LambdaQueryWrapper<Reservation> wrapper = baseQuery(query)
                .eq(Reservation::getReservationType, reservationType);
        if (ReservationType.OFFICIAL.name().equals(reservationType)) {
            applyOfficialScope(wrapper, admin);
        }
        List<Reservation> records = reservationMapper.selectList(wrapper);
        Function<Reservation, String> classifier = classifier(dimension);
        Map<String, List<Reservation>> grouped = records.stream()
                .collect(Collectors.groupingBy(classifier, LinkedHashMap::new, Collectors.toList()));
        auditLogService.record("RESERVATION_STATISTICS", "reservation", reservationType, "SUCCESS",
                Map.of("dimension", dimension));
        return grouped.entrySet().stream()
                .map(entry -> new ReservationStatistics(dimension, entry.getKey(), entry.getValue().size(),
                        entry.getValue().stream().mapToLong(this::peopleCount).sum()))
                .sorted(Comparator.comparing(ReservationStatistics::dimensionValue))
                .toList();
    }

    private LambdaQueryWrapper<Reservation> baseQuery(AdminReservationQuery query) {
        return new LambdaQueryWrapper<Reservation>()
                .ge(query.applyStart() != null, Reservation::getApplyTime, query.applyStart())
                .le(query.applyEnd() != null, Reservation::getApplyTime, query.applyEnd())
                .ge(query.visitStart() != null, Reservation::getVisitTime, query.visitStart())
                .le(query.visitEnd() != null, Reservation::getVisitTime, query.visitEnd())
                .eq(query.campusId() != null, Reservation::getCampusId, query.campusId())
                .like(query.organization() != null && !query.organization().isBlank(), Reservation::getOrganization, query.organization())
                .like(query.visitorName() != null && !query.visitorName().isBlank(), Reservation::getVisitorName, query.visitorName())
                .eq(query.idCard() != null && !query.idCard().isBlank(), Reservation::getIdCardHash, cryptoService.queryHash(query.idCard()))
                .eq(query.visitDeptId() != null, Reservation::getVisitDeptId, query.visitDeptId())
                .like(query.receptionist() != null && !query.receptionist().isBlank(), Reservation::getReceptionist, query.receptionist())
                .eq(query.approvalStatus() != null && !query.approvalStatus().isBlank(), Reservation::getApprovalStatus, query.approvalStatus());
    }

    private Page<Reservation> page(AdminReservationQuery query) {
        long page = query.page() == null || query.page() < 1 ? 1 : query.page();
        long size = query.size() == null || query.size() < 1 ? 20 : Math.min(query.size(), 100);
        return Page.of(page, size);
    }

    private void applyOfficialScope(LambdaQueryWrapper<Reservation> wrapper, SysAdmin admin) {
        if (admin == null) {
            wrapper.eq(Reservation::getId, -1L);
            return;
        }
        if (canSeeAllOfficial(admin)) {
            return;
        }
        wrapper.eq(Reservation::getVisitDeptId, admin.getDeptId() == null ? -1L : admin.getDeptId());
    }

    private void ensureOfficialScope(Reservation reservation, SysAdmin admin) {
        if (canSeeAllOfficial(admin)) {
            return;
        }
        if (admin == null || admin.getDeptId() == null || !admin.getDeptId().equals(reservation.getVisitDeptId())) {
            throw new BusinessException(403, "无权处理该公务预约");
        }
    }

    private boolean canSeeAllOfficial(SysAdmin admin) {
        if (admin == null) {
            return false;
        }
        Set<String> roles = stpInterface.getAdminRoleSet(admin.getId());
        return roles.contains(RoleCode.SCHOOL_ADMIN.name())
                || "ALL_OFFICIAL".equals(admin.getAuthScope())
                || "ALL".equals(admin.getAuthScope());
    }

    private Function<Reservation, String> classifier(String dimension) {
        return switch (dimension == null ? "" : dimension) {
            case "applyMonth" -> reservation -> reservation.getApplyTime().format(MONTH);
            case "visitMonth" -> reservation -> reservation.getVisitTime().format(MONTH);
            case "campus" -> reservation -> defaultValue(dictionaryService.campusName(reservation.getCampusId()));
            case "dept" -> reservation -> defaultValue(dictionaryService.deptName(reservation.getVisitDeptId()));
            default -> throw new BusinessException("统计维度错误");
        };
    }

    private long peopleCount(Reservation reservation) {
        return 1 + companionMapper.selectCount(new LambdaQueryWrapper<Companion>()
                .eq(Companion::getReservationId, reservation.getId()));
    }

    private String defaultValue(String value) {
        return value == null || value.isBlank() ? "未知" : value;
    }
}
