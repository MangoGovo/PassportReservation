package com.campus.passportreservation.controller.admin;

import com.campus.passportreservation.common.ApiResponse;
import com.campus.passportreservation.config.OpenApiConfig;
import com.campus.passportreservation.dto.DashboardDtos.DashboardSummaryResponse;
import com.campus.passportreservation.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@Tag(name = "后台首页", description = "后台首页指标、趋势和最近公务预约")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @Operation(summary = "查询后台首页汇总")
    public ApiResponse<DashboardSummaryResponse> summary() {
        return ApiResponse.ok(dashboardService.summary());
    }
}
