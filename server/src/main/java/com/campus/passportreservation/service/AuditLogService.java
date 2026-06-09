package com.campus.passportreservation.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.passportreservation.common.PageResponse;
import com.campus.passportreservation.dto.AuditDtos.AuditLogQuery;
import com.campus.passportreservation.dto.AuditDtos.AuditLogResponse;
import com.campus.passportreservation.entity.AuditLog;
import com.campus.passportreservation.entity.SysAdmin;
import com.campus.passportreservation.mapper.AuditLogMapper;
import com.campus.passportreservation.mapper.SysAdminMapper;
import com.campus.passportreservation.security.LoginContext;
import com.campus.passportreservation.security.StpInterfaceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogMapper auditLogMapper;
    private final SysAdminMapper adminMapper;
    private final StpInterfaceImpl stpInterface;
    private final CryptoService cryptoService;
    private final ObjectMapper objectMapper;

    public void record(String operationType, String targetType, Object targetId, String result, Object detail) {
        try {
            AuditLog log = new AuditLog();
            Long adminId = LoginContext.currentAdminIdOrNull();
            if (adminId != null) {
                SysAdmin admin = adminMapper.selectById(adminId);
                log.setOperatorId(adminId);
                log.setOperatorName(admin == null ? null : admin.getLoginName());
                log.setOperatorRole(String.join(",", stpInterface.getAdminRoleSet(adminId)));
            } else {
                log.setOperatorName(LoginContext.currentLoginIdOrNull());
            }
            log.setOperationType(operationType);
            log.setTargetType(targetType);
            log.setTargetId(targetId == null ? null : String.valueOf(targetId));
            log.setResult(result);
            fillRequest(log);
            log.setOperationTime(LocalDateTime.now());
            String detailJson = objectMapper.writeValueAsString(detail == null ? Map.of() : detail);
            log.setDetailJson(detailJson);
            log.setHmacValue(cryptoService.hmac(log.getOperationType() + "|" + log.getTargetType() + "|" + log.getTargetId() + "|" + detailJson));
            auditLogMapper.insert(log);
        } catch (Exception ignored) {
            // 审计失败不能阻断主业务，但生产环境应接入日志告警。
        }
    }

    public PageResponse<AuditLogResponse> query(AuditLogQuery query) {
        long page = query.page() == null || query.page() < 1 ? 1 : query.page();
        long size = query.size() == null || query.size() < 1 ? 20 : Math.min(query.size(), 100);
        Page<AuditLog> request = Page.of(page, size);
        Page<AuditLog> result = auditLogMapper.selectPage(request, new LambdaQueryWrapper<AuditLog>()
                .ge(query.startTime() != null, AuditLog::getOperationTime, query.startTime())
                .le(query.endTime() != null, AuditLog::getOperationTime, query.endTime())
                .like(query.operatorName() != null && !query.operatorName().isBlank(), AuditLog::getOperatorName, query.operatorName())
                .eq(query.operationType() != null && !query.operationType().isBlank(), AuditLog::getOperationType, query.operationType())
                .eq(query.result() != null && !query.result().isBlank(), AuditLog::getResult, query.result())
                .orderByDesc(AuditLog::getOperationTime));
        return PageResponse.of(result, result.getRecords().stream().map(this::toResponse).toList());
    }

    public AuditLogResponse detail(Long id) {
        return toResponse(auditLogMapper.selectById(id));
    }

    private AuditLogResponse toResponse(AuditLog log) {
        if (log == null) {
            return null;
        }
        return new AuditLogResponse(
                log.getId(),
                log.getOperatorId(),
                log.getOperatorName(),
                log.getOperatorRole(),
                log.getOperationType(),
                log.getTargetType(),
                log.getTargetId(),
                log.getResult(),
                log.getIpAddress(),
                log.getUserAgent(),
                log.getOperationTime(),
                log.getDetailJson(),
                log.getHmacValue()
        );
    }

    private void fillRequest(AuditLog log) {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
            return;
        }
        HttpServletRequest request = attributes.getRequest();
        log.setIpAddress(clientIp(request));
        log.setUserAgent(request.getHeader("User-Agent"));
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
