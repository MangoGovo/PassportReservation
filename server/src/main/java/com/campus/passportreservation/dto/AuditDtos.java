package com.campus.passportreservation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public final class AuditDtos {

    private AuditDtos() {
    }

    @Schema(name = "AuditLogQuery", description = "审计日志查询条件")
    public record AuditLogQuery(
            @Schema(description = "页码，从 1 开始", example = "1") Long page,
            @Schema(description = "每页条数", example = "20") Long size,
            @Schema(description = "操作开始时间") LocalDateTime startTime,
            @Schema(description = "操作结束时间") LocalDateTime endTime,
            @Schema(description = "操作用户", example = "admin") String operatorName,
            @Schema(description = "操作类型", example = "ADMIN_LOGIN") String operationType,
            @Schema(description = "操作结果", example = "SUCCESS") String result
    ) {
    }

    @Schema(name = "AuditLogResponse", description = "审计日志响应")
    public record AuditLogResponse(
            @Schema(description = "日志 ID", example = "1") Long id,
            @Schema(description = "操作人 ID", example = "1") Long operatorId,
            @Schema(description = "操作人登录名", example = "admin") String operatorName,
            @Schema(description = "操作人角色", example = "SYSTEM_ADMIN") String operatorRole,
            @Schema(description = "操作类型", example = "ADMIN_LOGIN") String operationType,
            @Schema(description = "操作对象类型", example = "sys_admin") String targetType,
            @Schema(description = "操作对象 ID", example = "1") String targetId,
            @Schema(description = "操作结果", example = "SUCCESS") String result,
            @Schema(description = "IP 地址", example = "127.0.0.1") String ipAddress,
            @Schema(description = "User-Agent") String userAgent,
            @Schema(description = "操作时间") LocalDateTime operationTime,
            @Schema(description = "扩展详情 JSON") String detailJson,
            @Schema(description = "HMAC-SHA256 完整性摘要") String hmacValue
    ) {
    }
}
