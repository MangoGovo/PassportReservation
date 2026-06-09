package com.campus.passportreservation.controller.mobile;

import com.campus.passportreservation.common.ApiResponse;
import com.campus.passportreservation.common.PageResponse;
import com.campus.passportreservation.dto.ReservationDtos.PassCodeResponse;
import com.campus.passportreservation.dto.ReservationDtos.ReservationCreateRequest;
import com.campus.passportreservation.dto.ReservationDtos.ReservationDetail;
import com.campus.passportreservation.dto.ReservationDtos.ReservationListItem;
import com.campus.passportreservation.dto.ReservationDtos.ReservationQueryRequest;
import com.campus.passportreservation.config.OpenApiConfig;
import com.campus.passportreservation.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mobile/reservations")
@RequiredArgsConstructor
@Tag(name = "移动端预约", description = "预约提交、我的预约查询、详情和通行码")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
public class MobileReservationController {

    private final ReservationService reservationService;

    @PostMapping
    @Operation(summary = "提交预约", description = "社会公众预约自动通过，公务预约进入待审核")
    public ApiResponse<ReservationDetail> create(@Valid @RequestBody ReservationCreateRequest request) {
        return ApiResponse.ok(reservationService.create(request));
    }

    @PostMapping("/query")
    @Operation(summary = "查询我的预约", description = "按姓名、身份证号、手机号查询当前登录用户本人的历史预约")
    public ApiResponse<PageResponse<ReservationListItem>> queryMine(@Valid @RequestBody ReservationQueryRequest request) {
        return ApiResponse.ok(reservationService.queryMine(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "查看预约详情")
    public ApiResponse<ReservationDetail> detail(@Parameter(description = "预约 ID", example = "1") @PathVariable Long id) {
        return ApiResponse.ok(reservationService.detailForMobile(id));
    }

    @GetMapping("/{id}/pass-code")
    @Operation(summary = "获取通行码", description = "仅审核通过且预约日期当天返回有效二维码图片")
    public ApiResponse<PassCodeResponse> passCode(@Parameter(description = "预约 ID", example = "1") @PathVariable Long id) {
        return ApiResponse.ok(reservationService.passCode(id));
    }
}
