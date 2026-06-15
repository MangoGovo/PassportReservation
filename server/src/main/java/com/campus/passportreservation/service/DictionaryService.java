package com.campus.passportreservation.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.passportreservation.common.BusinessException;
import com.campus.passportreservation.common.PageResponse;
import com.campus.passportreservation.dto.DictionaryDtos.CampusResponse;
import com.campus.passportreservation.dto.DictionaryDtos.DepartmentQuery;
import com.campus.passportreservation.dto.DictionaryDtos.DepartmentRequest;
import com.campus.passportreservation.dto.DictionaryDtos.DepartmentResponse;
import com.campus.passportreservation.dto.DictionaryDtos.DepartmentStatusRequest;
import com.campus.passportreservation.entity.Campus;
import com.campus.passportreservation.entity.Dept;
import com.campus.passportreservation.mapper.CampusMapper;
import com.campus.passportreservation.mapper.DeptMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DictionaryService {

    private final DeptMapper deptMapper;
    private final CampusMapper campusMapper;
    private final AuditLogService auditLogService;

    public List<DepartmentResponse> departments(String keyword) {
        return deptMapper.selectList(new LambdaQueryWrapper<Dept>()
                        .eq(Dept::getStatus, "ENABLED")
                        .and(keyword != null && !keyword.isBlank(), wrapper -> wrapper
                                .like(Dept::getDeptName, keyword)
                                .or()
                                .like(Dept::getDeptCode, keyword))
                        .orderByAsc(Dept::getDeptCode))
                .stream()
                .map(this::toDepartmentResponse)
                .toList();
    }

    public PageResponse<DepartmentResponse> adminDepartments(DepartmentQuery query) {
        long page = query.page() == null || query.page() < 1 ? 1 : query.page();
        long size = query.size() == null || query.size() < 1 ? 20 : Math.min(query.size(), 100);
        Page<Dept> result = deptMapper.selectPage(Page.of(page, size), new LambdaQueryWrapper<Dept>()
                .and(query.keyword() != null && !query.keyword().isBlank(), wrapper -> wrapper
                        .like(Dept::getDeptName, query.keyword())
                        .or()
                        .like(Dept::getDeptCode, query.keyword()))
                .eq(query.deptType() != null && !query.deptType().isBlank(), Dept::getDeptType, query.deptType())
                .eq(query.status() != null && !query.status().isBlank(), Dept::getStatus, query.status())
                .orderByAsc(Dept::getDeptCode));
        return PageResponse.of(result, result.getRecords().stream().map(this::toDepartmentResponse).toList());
    }

    public List<CampusResponse> campuses() {
        return campusMapper.selectList(new LambdaQueryWrapper<Campus>()
                        .eq(Campus::getStatus, "ENABLED")
                        .orderByAsc(Campus::getId))
                .stream()
                .map(this::toCampusResponse)
                .toList();
    }

    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest request) {
        Long duplicate = deptMapper.selectCount(new LambdaQueryWrapper<Dept>()
                .eq(Dept::getDeptCode, request.deptCode()));
        if (duplicate > 0) {
            throw new BusinessException("部门编号已存在");
        }
        LocalDateTime now = LocalDateTime.now();
        Dept dept = new Dept();
        dept.setDeptCode(request.deptCode());
        dept.setDeptType(request.deptType());
        dept.setDeptName(request.deptName());
        dept.setStatus(defaultStatus(request.status()));
        dept.setCreatedAt(now);
        dept.setUpdatedAt(now);
        dept.setDeleted(0);
        deptMapper.insert(dept);
        auditLogService.record("DEPT_CREATE", "dept", dept.getId(), "SUCCESS", request);
        return toDepartmentResponse(dept);
    }

    @Transactional
    public DepartmentResponse updateDepartment(Long id, DepartmentRequest request) {
        Dept dept = deptMapper.selectById(id);
        if (dept == null) {
            throw new BusinessException("部门不存在");
        }
        dept.setDeptCode(request.deptCode());
        dept.setDeptType(request.deptType());
        dept.setDeptName(request.deptName());
        dept.setStatus(defaultStatus(request.status()));
        dept.setUpdatedAt(LocalDateTime.now());
        deptMapper.updateById(dept);
        auditLogService.record("DEPT_UPDATE", "dept", id, "SUCCESS", request);
        return toDepartmentResponse(dept);
    }

    @Transactional
    public void deleteDepartment(Long id) {
        Dept dept = deptMapper.selectById(id);
        if (dept == null) {
            return;
        }
        deptMapper.deleteById(id);
        auditLogService.record("DEPT_DELETE", "dept", id, "SUCCESS", null);
    }

    @Transactional
    public DepartmentResponse updateDepartmentStatus(Long id, DepartmentStatusRequest request) {
        Dept dept = deptMapper.selectById(id);
        if (dept == null) {
            throw new BusinessException("部门不存在");
        }
        dept.setStatus(defaultStatus(request.status()));
        dept.setUpdatedAt(LocalDateTime.now());
        deptMapper.updateById(dept);
        auditLogService.record("DEPT_STATUS_UPDATE", "dept", id, "SUCCESS", request);
        return toDepartmentResponse(dept);
    }

    public DepartmentResponse department(Long id) {
        return toDepartmentResponse(deptMapper.selectById(id));
    }

    public String campusName(Long campusId) {
        Campus campus = campusId == null ? null : campusMapper.selectById(campusId);
        return campus == null ? null : campus.getCampusName();
    }

    public Map<Long, String> campusNames(Collection<Long> campusIds) {
        List<Long> ids = distinctIds(campusIds);
        if (ids.isEmpty()) {
            return Map.of();
        }
        return campusMapper.selectList(new LambdaQueryWrapper<Campus>().in(Campus::getId, ids))
                .stream()
                .collect(Collectors.toMap(Campus::getId, Campus::getCampusName, (left, right) -> left));
    }

    public String deptName(Long deptId) {
        Dept dept = deptId == null ? null : deptMapper.selectById(deptId);
        return dept == null ? null : dept.getDeptName();
    }

    public Map<Long, String> deptNames(Collection<Long> deptIds) {
        List<Long> ids = distinctIds(deptIds);
        if (ids.isEmpty()) {
            return Map.of();
        }
        return deptMapper.selectList(new LambdaQueryWrapper<Dept>().in(Dept::getId, ids))
                .stream()
                .collect(Collectors.toMap(Dept::getId, Dept::getDeptName, (left, right) -> left));
    }

    private List<Long> distinctIds(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return ids.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private DepartmentResponse toDepartmentResponse(Dept dept) {
        if (dept == null) {
            return null;
        }
        return new DepartmentResponse(dept.getId(), dept.getDeptCode(), dept.getDeptType(), dept.getDeptName(),
                dept.getStatus(), dept.getCreatedAt(), dept.getUpdatedAt());
    }

    private CampusResponse toCampusResponse(Campus campus) {
        return new CampusResponse(campus.getId(), campus.getCampusCode(), campus.getCampusName(), campus.getStatus());
    }

    private String defaultStatus(String status) {
        return status == null || status.isBlank() ? "ENABLED" : status;
    }
}
