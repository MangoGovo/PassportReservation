package com.campus.passportreservation.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("companion")
public class Companion {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long reservationId;

    private String name;

    private String idCardCipher;

    private String idCardHash;

    private String phoneCipher;

    private String phoneHash;

    private LocalDateTime createdAt;
}
