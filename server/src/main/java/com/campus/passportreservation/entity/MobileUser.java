package com.campus.passportreservation.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("mobile_user")
public class MobileUser {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String phoneCipher;

    private String phoneHash;

    private String passwordHash;

    private String name;

    private String idCardCipher;

    private String idCardHash;

    private String accountStatus;

    private Integer loginFailCount;

    private LocalDateTime lockUntil;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
