package com.campus.passportreservation.controller.mobile;

import com.campus.passportreservation.common.ApiResponse;
import com.campus.passportreservation.dto.AuthDtos.LoginResponse;
import com.campus.passportreservation.dto.AuthDtos.LoginStatusResponse;
import com.campus.passportreservation.dto.AuthDtos.MobileLoginRequest;
import com.campus.passportreservation.dto.AuthDtos.MobileRegisterRequest;
import com.campus.passportreservation.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mobile/auth")
@RequiredArgsConstructor
@Tag(name = "移动端认证", description = "手机端注册、登录、退出和登录状态查询")
public class MobileAuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "手机端注册", description = "注册手机端用户，成功后自动登录并返回 Sa-Token")
    public ApiResponse<LoginResponse> register(@Valid @RequestBody MobileRegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "手机端登录", description = "手机号和密码登录，连续失败达到阈值后锁定账号")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody MobileLoginRequest request) {
        return ApiResponse.ok(authService.mobileLogin(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "手机端退出登录")
    public ApiResponse<Void> logout() {
        authService.logout("MOBILE_LOGOUT");
        return ApiResponse.ok();
    }

    @GetMapping("/status")
    @Operation(summary = "查询手机端登录状态", description = "用于前端识别游客态")
    public ApiResponse<LoginStatusResponse> status() {
        return ApiResponse.ok(authService.status());
    }
}
