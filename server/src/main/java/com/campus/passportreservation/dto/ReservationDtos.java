package com.campus.passportreservation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class ReservationDtos {

    private ReservationDtos() {
    }

    @Schema(name = "CompanionRequest", description = "随行人员请求")
    public record CompanionRequest(
            @Schema(description = "姓名", example = "李四") @NotBlank @Size(min = 2, max = 30) String name,
            @Schema(description = "身份证号", example = "110101199001011234") @NotBlank String idCard,
            @Schema(description = "手机号", example = "13800138000") @NotBlank String phone
    ) {
    }

    @Schema(name = "ReservationCreateRequest", description = "提交预约请求")
    public record ReservationCreateRequest(
            @Schema(description = "预约类型：PUBLIC 社会公众预约，OFFICIAL 公务预约", example = "PUBLIC") @NotBlank String reservationType,
            @Schema(description = "预约校区 ID", example = "1") @NotNull Long campusId,
            @Schema(description = "预约进校时间，限申请日起 7 个自然日内", example = "2026-06-08T09:00:00") @NotNull LocalDateTime visitTime,
            @Schema(description = "所在单位", example = "某某科技有限公司") @NotBlank @Size(min = 2, max = 100) String organization,
            @Schema(description = "预约人姓名", example = "张三") @NotBlank @Size(min = 2, max = 30) String visitorName,
            @Schema(description = "身份证号", example = "110101199001011234") @NotBlank String idCard,
            @Schema(description = "手机号", example = "13800138000") @NotBlank String phone,
            @Schema(description = "交通方式", example = "PUBLIC_TRANSPORT") @NotBlank String trafficType,
            @Schema(description = "车牌号，自驾时填写", example = "沪A12345") String plateNo,
            @Schema(description = "随行人员列表") List<@Valid CompanionRequest> companions,
            @Schema(description = "公务访问部门 ID，公务预约必填", example = "2") Long visitDeptId,
            @Schema(description = "公务访问接待人，公务预约必填", example = "王老师") String receptionist,
            @Schema(description = "来访事由，公务预约必填", example = "项目合作交流") String visitReason
    ) {
    }

    @Schema(name = "ReservationQueryRequest", description = "我的预约查询请求")
    public record ReservationQueryRequest(
            @Schema(description = "预约人姓名", example = "张三") @NotBlank String name,
            @Schema(description = "身份证号", example = "110101199001011234") @NotBlank String idCard,
            @Schema(description = "手机号", example = "13800138000") @NotBlank String phone,
            @Schema(description = "页码，从 1 开始", example = "1") Long page,
            @Schema(description = "每页条数", example = "20") Long size
    ) {
    }

    @Schema(name = "AdminReservationQuery", description = "后台预约查询条件")
    public record AdminReservationQuery(
            @Schema(description = "页码，从 1 开始", example = "1") Long page,
            @Schema(description = "每页条数", example = "20") Long size,
            @Schema(description = "申请开始时间") LocalDateTime applyStart,
            @Schema(description = "申请结束时间") LocalDateTime applyEnd,
            @Schema(description = "预约开始时间") LocalDateTime visitStart,
            @Schema(description = "预约结束时间") LocalDateTime visitEnd,
            @Schema(description = "校区 ID", example = "1") Long campusId,
            @Schema(description = "所在单位模糊查询", example = "科技") String organization,
            @Schema(description = "预约人姓名模糊查询", example = "张") String visitorName,
            @Schema(description = "身份证号精确查询", example = "110101199001011234") String idCard,
            @Schema(description = "公务访问部门 ID", example = "2") Long visitDeptId,
            @Schema(description = "接待人模糊查询", example = "王老师") String receptionist,
            @Schema(description = "审核状态", example = "PENDING") String approvalStatus
    ) {
    }

    @Schema(name = "ReservationListItem", description = "预约列表项")
    public record ReservationListItem(
            Long id,
            String reservationNo,
            String reservationType,
            Long campusId,
            String campusName,
            LocalDateTime applyTime,
            LocalDateTime visitTime,
            String organization,
            String visitorName,
            String idCard,
            String phone,
            Long visitDeptId,
            String visitDeptName,
            String receptionist,
            String approvalStatus,
            Integer peopleCount
    ) {
    }

    @Schema(name = "CompanionResponse", description = "随行人员响应")
    public record CompanionResponse(
            Long id,
            String name,
            String idCard,
            String phone
    ) {
    }

    @Schema(name = "ReservationDetail", description = "预约详情响应")
    public record ReservationDetail(
            Long id,
            String reservationNo,
            String reservationType,
            Long campusId,
            String campusName,
            LocalDateTime applyTime,
            LocalDateTime visitTime,
            LocalDateTime validStartTime,
            LocalDateTime validEndTime,
            String organization,
            String visitorName,
            String idCard,
            String phone,
            String trafficType,
            String plateNo,
            Long visitDeptId,
            String visitDeptName,
            String receptionist,
            String visitReason,
            String approvalStatus,
            String rejectReason,
            String passStatus,
            List<CompanionResponse> companions
    ) {
    }

    @Schema(name = "PassCodeResponse", description = "通行码响应")
    public record PassCodeResponse(
            @Schema(description = "预约 ID", example = "1") Long reservationId,
            @Schema(description = "预约编号", example = "R202606080001") String reservationNo,
            @Schema(description = "通行码状态", example = "VALID") String passStatus,
            @Schema(description = "状态文案", example = "通行码有效") String statusText,
            @Schema(description = "二维码 JSON 载荷") String qrPayload,
            @Schema(description = "二维码 PNG Base64，非有效状态可能为空") String qrBase64,
            @Schema(description = "有效期开始时间") LocalDateTime validStartTime,
            @Schema(description = "有效期结束时间") LocalDateTime validEndTime
    ) {
    }

    @Schema(name = "CurrentPassResponse", description = "当前通行码响应")
    public record CurrentPassResponse(
            @Schema(description = "当前预约信息") ReservationDetail reservation,
            @Schema(description = "当前预约对应的个人身份通行码") PassCodeResponse passCode
    ) {
    }

    @Schema(name = "ApprovalRequest", description = "公务预约审核请求")
    public record ApprovalRequest(
            @Schema(description = "审核结果：APPROVED/REJECTED", example = "APPROVED") @NotBlank String result,
            @Schema(description = "拒绝原因，REJECTED 时必填", example = "来访信息不完整") String rejectReason
    ) {
    }

    @Schema(name = "ReservationStatistics", description = "预约统计结果")
    public record ReservationStatistics(
            @Schema(description = "统计维度", example = "campus") String dimension,
            @Schema(description = "维度值", example = "主校区") String dimensionValue,
            @Schema(description = "预约次数", example = "10") long reservationCount,
            @Schema(description = "预约人次", example = "15") long peopleCount
    ) {
    }
}
