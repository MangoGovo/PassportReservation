package com.campus.passportreservation.dto;

import com.campus.passportreservation.dto.ReservationDtos.ReservationListItem;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

public final class DashboardDtos {

    private DashboardDtos() {
    }

    @Schema(name = "DashboardTrendPoint", description = "后台首页趋势点")
    public record DashboardTrendPoint(
            @Schema(description = "日期，格式 yyyy-MM-dd", example = "2026-06-10") String date,
            @Schema(description = "预约次数", example = "12") long reservationCount,
            @Schema(description = "预约人次", example = "18") long peopleCount
    ) {
    }

    @Schema(name = "DashboardSummaryResponse", description = "后台首页汇总数据")
    public record DashboardSummaryResponse(
            @Schema(description = "今日进校预约数", example = "24") long todayReservations,
            @Schema(description = "待审核公务预约数", example = "5") long pendingApprovals,
            @Schema(description = "本月预约人次", example = "350") long monthVisitors,
            @Schema(description = "启用部门数", example = "18") long activeDepartments,
            @Schema(description = "最近公务预约") List<ReservationListItem> recentOfficialReservations,
            @Schema(description = "近 7 天预约趋势") List<DashboardTrendPoint> visitTrend,
            @Schema(description = "本月预约高峰时段", example = "09:00 - 10:00") String peakHour,
            @Schema(description = "校门拥堵状态", example = "Normal") String gateCongestion
    ) {
    }
}
