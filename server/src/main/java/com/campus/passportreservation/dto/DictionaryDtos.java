package com.campus.passportreservation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public final class DictionaryDtos {

    private DictionaryDtos() {
    }

    @Schema(name = "DepartmentRequest", description = "部门新增或修改请求")
    public record DepartmentRequest(
            @Schema(description = "部门编号", example = "CS") @NotBlank String deptCode,
            @Schema(description = "部门类型", example = "学院") @NotBlank String deptType,
            @Schema(description = "部门名称", example = "计算机学院") @NotBlank String deptName,
            @Schema(description = "状态：ENABLED/DISABLED", example = "ENABLED") String status
    ) {
    }

    @Schema(name = "DepartmentResponse", description = "部门响应")
    public record DepartmentResponse(
            @Schema(description = "部门 ID", example = "1") Long id,
            @Schema(description = "部门编号", example = "CS") String deptCode,
            @Schema(description = "部门类型", example = "学院") String deptType,
            @Schema(description = "部门名称", example = "计算机学院") String deptName,
            @Schema(description = "状态", example = "ENABLED") String status,
            @Schema(description = "创建时间") LocalDateTime createdAt,
            @Schema(description = "更新时间") LocalDateTime updatedAt
    ) {
    }

    @Schema(name = "CampusResponse", description = "校区响应")
    public record CampusResponse(
            @Schema(description = "校区 ID", example = "1") Long id,
            @Schema(description = "校区编号", example = "MAIN") String campusCode,
            @Schema(description = "校区名称", example = "主校区") String campusName,
            @Schema(description = "状态", example = "ENABLED") String status
    ) {
    }
}
