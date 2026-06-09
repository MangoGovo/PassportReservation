package com.campus.passportreservation.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_admin")
public class SysAdmin {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String adminNo;

    private String realName;

    private String loginName;

    private String passwordHash;

    private Long deptId;

    private String phoneCipher;

    private String phoneHash;

    private String accountStatus;

    private String authScope;

    private Integer loginFailCount;

    private LocalDateTime lockUntil;

    private LocalDateTime passwordUpdatedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
