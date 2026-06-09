package com.campus.passportreservation.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("reservation")
public class Reservation {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String reservationNo;

    private Long mobileUserId;

    private String reservationType;

    private Long campusId;

    private LocalDateTime applyTime;

    private LocalDateTime visitTime;

    private LocalDateTime validStartTime;

    private LocalDateTime validEndTime;

    private String organization;

    private String visitorName;

    private String idCardCipher;

    private String idCardHash;

    private String phoneCipher;

    private String phoneHash;

    private String trafficType;

    private String plateNo;

    private Long visitDeptId;

    private String receptionist;

    private String visitReason;

    private String approvalStatus;

    private String rejectReason;

    private Long approvedBy;

    private LocalDateTime approvedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
