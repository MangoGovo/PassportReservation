package com.campus.passportreservation.controller.admin;

import com.campus.passportreservation.common.ApiResponse;
import com.campus.passportreservation.dto.AuthDtos.AdminLoginRequest;
import com.campus.passportreservation.dto.AuthDtos.ChangePasswordRequest;
import com.campus.passportreservation.dto.AuthDtos.LoginResponse;
import com.campus.passportreservation.dto.AuthDtos.LoginStatusResponse;
import com.campus.passportreservation.config.OpenApiConfig;
import com.campus.passportreservation.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
@Tag(name = "后台认证", description = "后台管理员登录、退出、改密和状态查询")
public class AdminAuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "后台管理员登录", description = "登录成功返回 Sa-Token，连续失败达到阈值后锁定账号")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody AdminLoginRequest request) {
        return ApiResponse.ok(authService.adminLogin(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "后台退出登录")
    @SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
    public ApiResponse<Void> logout() {
        authService.logout("ADMIN_LOGOUT");
        return ApiResponse.ok();
    }

    @PutMapping("/password")
    @Operation(summary = "修改后台登录密码", description = "密码需满足复杂度要求")
    @SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changeAdminPassword(request);
        return ApiResponse.ok();
    }

    @GetMapping("/status")
    @Operation(summary = "查询后台登录状态")
    @SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
    public ApiResponse<LoginStatusResponse> status() {
        return ApiResponse.ok(authService.status());
    }
}
