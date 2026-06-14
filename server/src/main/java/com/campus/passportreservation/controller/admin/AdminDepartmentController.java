package com.campus.passportreservation.controller.admin;

import com.campus.passportreservation.common.ApiResponse;
import com.campus.passportreservation.common.PageResponse;
import com.campus.passportreservation.config.OpenApiConfig;
import com.campus.passportreservation.dto.DictionaryDtos.DepartmentQuery;
import com.campus.passportreservation.dto.DictionaryDtos.DepartmentRequest;
import com.campus.passportreservation.dto.DictionaryDtos.DepartmentResponse;
import com.campus.passportreservation.dto.DictionaryDtos.DepartmentStatusRequest;
import com.campus.passportreservation.service.DictionaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/departments")
@RequiredArgsConstructor
@Tag(name = "后台部门管理", description = "部门新增、修改、删除、查询")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
public class AdminDepartmentController {

    private final DictionaryService dictionaryService;

    @GetMapping
    @Operation(summary = "分页查询部门列表")
    public ApiResponse<PageResponse<DepartmentResponse>> list(@ModelAttribute DepartmentQuery query) {
        return ApiResponse.ok(dictionaryService.adminDepartments(query));
    }

    @PostMapping
    @Operation(summary = "新增部门")
    public ApiResponse<DepartmentResponse> create(@Valid @RequestBody DepartmentRequest request) {
        return ApiResponse.ok(dictionaryService.createDepartment(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "查看部门详情")
    public ApiResponse<DepartmentResponse> detail(@Parameter(description = "部门 ID", example = "1") @PathVariable Long id) {
        return ApiResponse.ok(dictionaryService.department(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "修改部门")
    public ApiResponse<DepartmentResponse> update(@Parameter(description = "部门 ID", example = "1") @PathVariable Long id, @Valid @RequestBody DepartmentRequest request) {
        return ApiResponse.ok(dictionaryService.updateDepartment(id, request));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "启用或禁用部门")
    public ApiResponse<DepartmentResponse> updateStatus(@Parameter(description = "部门 ID", example = "1") @PathVariable Long id, @Valid @RequestBody DepartmentStatusRequest request) {
        return ApiResponse.ok(dictionaryService.updateDepartmentStatus(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除部门", description = "逻辑删除部门")
    public ApiResponse<Void> delete(@Parameter(description = "部门 ID", example = "1") @PathVariable Long id) {
        dictionaryService.deleteDepartment(id);
        return ApiResponse.ok();
    }
}
