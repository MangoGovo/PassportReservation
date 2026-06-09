package com.campus.passportreservation.controller.mobile;

import com.campus.passportreservation.common.ApiResponse;
import com.campus.passportreservation.dto.DictionaryDtos.CampusResponse;
import com.campus.passportreservation.dto.DictionaryDtos.DepartmentResponse;
import com.campus.passportreservation.service.DictionaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/mobile")
@RequiredArgsConstructor
@Tag(name = "移动端字典", description = "移动端预约表单使用的部门和校区字典")
public class MobileDictionaryController {

    private final DictionaryService dictionaryService;

    @GetMapping("/departments")
    @Operation(summary = "查询可选部门", description = "公务预约选择访问部门使用")
    public ApiResponse<List<DepartmentResponse>> departments(@Parameter(description = "部门名称或编号关键字") @RequestParam(required = false) String keyword) {
        return ApiResponse.ok(dictionaryService.departments(keyword));
    }

    @GetMapping("/campuses")
    @Operation(summary = "查询可选校区")
    public ApiResponse<List<CampusResponse>> campuses() {
        return ApiResponse.ok(dictionaryService.campuses());
    }
}
