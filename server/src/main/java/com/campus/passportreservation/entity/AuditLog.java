package com.campus.passportreservation.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("audit_log")
public class AuditLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long operatorId;

    private String operatorName;

    private String operatorRole;

    private String operationType;

    private String targetType;

    private String targetId;

    private String result;

    private String ipAddress;

    private String userAgent;

    private LocalDateTime operationTime;

    private String detailJson;

    private String hmacValue;
}
