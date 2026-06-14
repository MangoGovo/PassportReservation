package com.campus.passportreservation.controller.admin;

import com.campus.passportreservation.common.ApiResponse;
import com.campus.passportreservation.common.PageResponse;
import com.campus.passportreservation.config.OpenApiConfig;
import com.campus.passportreservation.dto.AuditDtos.AuditLogQuery;
import com.campus.passportreservation.dto.AuditDtos.AuditLogResponse;
import com.campus.passportreservation.dto.AuditDtos.AuditLogSummaryResponse;
import com.campus.passportreservation.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@Tag(name = "后台审计日志", description = "审计日志查询和详情")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
public class AdminAuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @Operation(summary = "查询审计日志")
    public ApiResponse<PageResponse<AuditLogResponse>> list(@ModelAttribute AuditLogQuery query) {
        return ApiResponse.ok(auditLogService.query(query));
    }

    @GetMapping("/summary")
    @Operation(summary = "查询审计日志摘要")
    public ApiResponse<AuditLogSummaryResponse> summary() {
        return ApiResponse.ok(auditLogService.summary());
    }

    @GetMapping("/{id}")
    @Operation(summary = "查看审计日志详情")
    public ApiResponse<AuditLogResponse> detail(@Parameter(description = "日志 ID", example = "1") @PathVariable Long id) {
        return ApiResponse.ok(auditLogService.detail(id));
    }
}
