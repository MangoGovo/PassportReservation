package com.campus.passportreservation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.List;

public final class AuthDtos {

    private AuthDtos() {
    }

    @Schema(name = "MobileRegisterRequest", description = "手机端用户注册请求")
    public record MobileRegisterRequest(
            @Schema(description = "手机号", example = "13800138000") String phone,
            @Schema(description = "手机号，兼容前端 mobile 字段", example = "13800138000") String mobile,
            @Schema(description = "密码，至少 8 位且包含数字、大小写字母和特殊字符", example = "User123!") @NotBlank String password,
            @Schema(description = "姓名", example = "张三") String name,
            @Schema(description = "姓名，兼容前端 realName 字段", example = "张三") String realName,
            @Schema(description = "身份证号", example = "110101199001011234") String idCard
    ) {
        public String normalizedPhone() {
            return firstNonBlank(phone, mobile);
        }

        public String normalizedName() {
            return firstNonBlank(name, realName);
        }
    }

    @Schema(name = "MobileLoginRequest", description = "手机端用户登录请求")
    public record MobileLoginRequest(
            @Schema(description = "手机号", example = "13800138000") String phone,
            @Schema(description = "手机号，兼容前端 mobile 字段", example = "13800138000") String mobile,
            @Schema(description = "密码", example = "User123!") @NotBlank String password
    ) {
        public String normalizedPhone() {
            return firstNonBlank(phone, mobile);
        }
    }

    @Schema(name = "AdminLoginRequest", description = "后台管理员登录请求")
    public record AdminLoginRequest(
            @Schema(description = "登录名", example = "admin") @NotBlank String loginName,
            @Schema(description = "密码", example = "Admin123!") @NotBlank String password
    ) {
    }

    @Schema(name = "ChangePasswordRequest", description = "后台管理员修改密码请求")
    public record ChangePasswordRequest(
            @Schema(description = "原密码", example = "Admin123!") @NotBlank String oldPassword,
            @Schema(description = "新密码", example = "Admin456!") @NotBlank String newPassword
    ) {
    }

    @Schema(name = "LoginResponse", description = "登录响应")
    public record LoginResponse(
            @Schema(description = "用户 ID", example = "1") Long userId,
            @Schema(description = "Token 请求头名称", example = "Authorization") String tokenName,
            @Schema(description = "Token 值") String tokenValue,
            @Schema(description = "用户类型", example = "ADMIN") String userType,
            @Schema(description = "展示名称", example = "系统管理员") String displayName,
            @Schema(description = "角色编码列表") List<String> roles,
            @Schema(description = "权限编码列表") List<String> permissions,
            @Schema(description = "后台密码是否已过期", example = "false") boolean passwordExpired
    ) {
    }

    @Schema(name = "LoginStatusResponse", description = "登录状态响应")
    public record LoginStatusResponse(
            @Schema(description = "是否已登录", example = "true") boolean login,
            @Schema(description = "用户类型", example = "MOBILE") String userType,
            @Schema(description = "用户 ID", example = "1") Long userId,
            @Schema(description = "展示名称", example = "张三") String displayName
    ) {
    }

    @Schema(name = "AdminListItem", description = "管理员列表项")
    public record AdminListItem(
            @Schema(description = "管理员 ID", example = "1") Long id,
            @Schema(description = "管理员编号", example = "A00000001") String adminNo,
            @Schema(description = "真实姓名", example = "系统管理员") String realName,
            @Schema(description = "登录名", example = "admin") String loginName,
            @Schema(description = "部门 ID", example = "1") Long deptId,
            @Schema(description = "脱敏手机号", example = "138****8000") String phone,
            @Schema(description = "账号状态", example = "NORMAL") String accountStatus,
            @Schema(description = "授权范围", example = "ALL") String authScope,
            @Schema(description = "角色 ID 列表", example = "[1,3]") List<Long> roleIds,
            @Schema(description = "角色编码列表", example = "[\"SCHOOL_ADMIN\"]") List<String> roleCodes,
            @Schema(description = "密码更新时间") LocalDateTime passwordUpdatedAt
    ) {
    }

    @Schema(name = "AdminCreateRequest", description = "新增管理员请求")
    public record AdminCreateRequest(
            @Schema(description = "真实姓名", example = "李老师") @NotBlank String realName,
            @Schema(description = "登录名", example = "dept_admin") @NotBlank String loginName,
            @Schema(description = "初始密码", example = "Admin123!") @NotBlank String password,
            @Schema(description = "部门 ID", example = "2") Long deptId,
            @Schema(description = "手机号", example = "13800138000") String phone,
            @Schema(description = "角色 ID 列表", example = "[2]") List<Long> roleIds,
            @Schema(description = "授权范围", example = "ALL_OFFICIAL") String authScope
    ) {
    }

    @Schema(name = "AdminUpdateRequest", description = "修改管理员请求")
    public record AdminUpdateRequest(
            @Schema(description = "真实姓名", example = "李老师") @NotBlank String realName,
            @Schema(description = "登录名", example = "dept_admin") @NotBlank String loginName,
            @Schema(description = "部门 ID", example = "2") Long deptId,
            @Schema(description = "手机号", example = "13800138000") String phone,
            @Schema(description = "角色 ID 列表", example = "[2]") List<Long> roleIds,
            @Schema(description = "授权范围", example = "ALL_OFFICIAL") String authScope,
            @Schema(description = "账号状态", example = "NORMAL") String accountStatus
    ) {
    }

    @Schema(name = "AdminPasswordResetRequest", description = "重置管理员密码请求")
    public record AdminPasswordResetRequest(
            @Schema(description = "新密码，至少 8 位且包含数字、大小写字母和特殊字符", example = "Admin456!") @NotBlank String newPassword
    ) {
    }

    @Schema(name = "AdminStatusRequest", description = "管理员状态修改请求")
    public record AdminStatusRequest(
            @Schema(description = "账号状态：NORMAL/DISABLED/LOCKED", example = "DISABLED") @NotBlank String accountStatus
    ) {
    }

    @Schema(name = "RoleOption", description = "后台角色选项")
    public record RoleOption(
            @Schema(description = "角色 ID", example = "1") Long id,
            @Schema(description = "角色编码", example = "SCHOOL_ADMIN") String roleCode,
            @Schema(description = "角色名称", example = "学校管理员") String roleName
    ) {
    }

    private static String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        return second;
    }
}
