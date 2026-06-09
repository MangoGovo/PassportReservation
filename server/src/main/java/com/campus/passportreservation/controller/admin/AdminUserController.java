package com.campus.passportreservation.controller.admin;

import com.campus.passportreservation.common.ApiResponse;
import com.campus.passportreservation.common.PageResponse;
import com.campus.passportreservation.config.OpenApiConfig;
import com.campus.passportreservation.dto.AuthDtos.AdminCreateRequest;
import com.campus.passportreservation.dto.AuthDtos.AdminListItem;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/admins")
@RequiredArgsConstructor
@Tag(name = "后台管理员管理", description = "后台账号查询、新增和删除")
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

    @PostMapping
    @Operation(summary = "新增管理员")
    public ApiResponse<AdminListItem> create(@Valid @RequestBody AdminCreateRequest request) {
        return ApiResponse.ok(adminUserService.create(request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除管理员", description = "逻辑删除后台账号")
    public ApiResponse<Void> delete(@Parameter(description = "管理员 ID", example = "1") @PathVariable Long id) {
        adminUserService.delete(id);
        return ApiResponse.ok();
    }
}
