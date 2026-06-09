package com.campus.passportreservation.controller.admin;

import com.campus.passportreservation.common.ApiResponse;
import com.campus.passportreservation.common.PageResponse;
import com.campus.passportreservation.config.OpenApiConfig;
import com.campus.passportreservation.dto.ReservationDtos.AdminReservationQuery;
import com.campus.passportreservation.dto.ReservationDtos.ApprovalRequest;
import com.campus.passportreservation.dto.ReservationDtos.ReservationDetail;
import com.campus.passportreservation.dto.ReservationDtos.ReservationListItem;
import com.campus.passportreservation.dto.ReservationDtos.ReservationStatistics;
import com.campus.passportreservation.enums.ReservationType;
import com.campus.passportreservation.service.AdminReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "后台预约管理", description = "社会公众预约、公务预约、审核和统计")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
public class AdminReservationController {

    private final AdminReservationService adminReservationService;

    @GetMapping("/public-reservations")
    @Operation(summary = "查询社会公众预约列表")
    public ApiResponse<PageResponse<ReservationListItem>> publicReservations(@ModelAttribute AdminReservationQuery query) {
        return ApiResponse.ok(adminReservationService.publicReservations(query));
    }

    @GetMapping("/public-reservations/{id}")
    @Operation(summary = "查看社会公众预约详情")
    public ApiResponse<ReservationDetail> publicDetail(@Parameter(description = "预约 ID", example = "1") @PathVariable Long id) {
        return ApiResponse.ok(adminReservationService.detail(id));
    }

    @GetMapping("/public-reservations/statistics")
    @Operation(summary = "社会公众预约统计", description = "dimension 支持 applyMonth、visitMonth、campus")
    public ApiResponse<List<ReservationStatistics>> publicStatistics(
            @Parameter(description = "统计维度", example = "campus") @RequestParam String dimension,
            @ModelAttribute AdminReservationQuery query
    ) {
        return ApiResponse.ok(adminReservationService.statistics(ReservationType.PUBLIC.name(), dimension, query));
    }

    @GetMapping("/official-reservations")
    @Operation(summary = "查询公务预约列表", description = "部门管理员默认只查询本部门公务预约")
    public ApiResponse<PageResponse<ReservationListItem>> officialReservations(@ModelAttribute AdminReservationQuery query) {
        return ApiResponse.ok(adminReservationService.officialReservations(query));
    }

    @GetMapping("/official-reservations/{id}")
    @Operation(summary = "查看公务预约详情")
    public ApiResponse<ReservationDetail> officialDetail(@Parameter(description = "预约 ID", example = "1") @PathVariable Long id) {
        return ApiResponse.ok(adminReservationService.detail(id));
    }

    @PostMapping("/official-reservations/{id}/approval")
    @Operation(summary = "审核公务预约", description = "仅待审核记录可审核，通过后生成有效通行码资格，拒绝必须填写原因")
    public ApiResponse<ReservationDetail> approve(@Parameter(description = "预约 ID", example = "1") @PathVariable Long id, @Valid @RequestBody ApprovalRequest request) {
        return ApiResponse.ok(adminReservationService.approve(id, request));
    }

    @GetMapping("/official-reservations/statistics")
    @Operation(summary = "公务预约统计", description = "dimension 支持 applyMonth、visitMonth、campus、dept")
    public ApiResponse<List<ReservationStatistics>> officialStatistics(
            @Parameter(description = "统计维度", example = "dept") @RequestParam String dimension,
            @ModelAttribute AdminReservationQuery query
    ) {
        return ApiResponse.ok(adminReservationService.statistics(ReservationType.OFFICIAL.name(), dimension, query));
    }
}
