package com.campus.passportreservation.controller.admin;

import com.campus.passportreservation.common.ApiResponse;
import com.campus.passportreservation.common.PageResponse;
import com.campus.passportreservation.config.OpenApiConfig;
import com.campus.passportreservation.dto.AuthDtos.AdminCreateRequest;
import com.campus.passportreservation.dto.AuthDtos.AdminListItem;
import com.campus.passportreservation.dto.AuthDtos.AdminPasswordResetRequest;
import com.campus.passportreservation.dto.AuthDtos.AdminStatusRequest;
import com.campus.passportreservation.dto.AuthDtos.AdminUpdateRequest;
import com.campus.passportreservation.dto.AuthDtos.RoleOption;
import com.campus.passportreservation.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/admins")
@RequiredArgsConstructor
@Tag(name = "后台管理员管理", description = "后台账号查询、新增、修改、重置密码和删除")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @Operation(summary = "查询管理员列表")
    public ApiResponse<PageResponse<AdminListItem>> list(
            @Parameter(description = "姓名或登录名关键字") @RequestParam(required = false) String keyword,
            @Parameter(description = "页码，从 1 开始", example = "1") @RequestParam(required = false) Long page,
            @Parameter(description = "每页条数", example = "20") @RequestParam(required = false) Long size
    ) {
        return ApiResponse.ok(adminUserService.list(keyword, page, size));
    }

    @GetMapping("/roles")
    @Operation(summary = "查询可选角色")
    public ApiResponse<java.util.List<RoleOption>> roles() {
        return ApiResponse.ok(adminUserService.roles());
    }

    @PostMapping
    @Operation(summary = "新增管理员")
    public ApiResponse<AdminListItem> create(@Valid @RequestBody AdminCreateRequest request) {
        return ApiResponse.ok(adminUserService.create(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "查看管理员详情")
    public ApiResponse<AdminListItem> detail(@Parameter(description = "管理员 ID", example = "1") @PathVariable Long id) {
        return ApiResponse.ok(adminUserService.detail(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "修改管理员")
    public ApiResponse<AdminListItem> update(@Parameter(description = "管理员 ID", example = "1") @PathVariable Long id, @Valid @RequestBody AdminUpdateRequest request) {
        return ApiResponse.ok(adminUserService.update(id, request));
    }

    @PutMapping("/{id}/password")
    @Operation(summary = "重置管理员密码", description = "新密码使用 BCrypt 加密存储")
    public ApiResponse<AdminListItem> resetPassword(@Parameter(description = "管理员 ID", example = "1") @PathVariable Long id, @Valid @RequestBody AdminPasswordResetRequest request) {
        return ApiResponse.ok(adminUserService.resetPassword(id, request));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "启用、禁用或锁定管理员")
    public ApiResponse<AdminListItem> updateStatus(@Parameter(description = "管理员 ID", example = "1") @PathVariable Long id, @Valid @RequestBody AdminStatusRequest request) {
        return ApiResponse.ok(adminUserService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除管理员", description = "逻辑删除后台账号")
    public ApiResponse<Void> delete(@Parameter(description = "管理员 ID", example = "1") @PathVariable Long id) {
        adminUserService.delete(id);
        return ApiResponse.ok();
    }
}
