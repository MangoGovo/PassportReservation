package com.campus.passportreservation.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.campus.passportreservation.common.BusinessException;
import com.campus.passportreservation.dto.DictionaryDtos.CampusResponse;
import com.campus.passportreservation.dto.DictionaryDtos.DepartmentRequest;
import com.campus.passportreservation.dto.DictionaryDtos.DepartmentResponse;
import com.campus.passportreservation.entity.Campus;
import com.campus.passportreservation.entity.Dept;
import com.campus.passportreservation.mapper.CampusMapper;
import com.campus.passportreservation.mapper.DeptMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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

    public List<CampusResponse> campuses() {
        return campusMapper.selectList(new LambdaQueryWrapper<Campus>()
                        .eq(Campus::getStatus, "ENABLED")
                        .orderByAsc(Campus::getCampusCode))
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

    public DepartmentResponse department(Long id) {
        return toDepartmentResponse(deptMapper.selectById(id));
    }

    public String campusName(Long campusId) {
        Campus campus = campusId == null ? null : campusMapper.selectById(campusId);
        return campus == null ? null : campus.getCampusName();
    }

    public String deptName(Long deptId) {
        Dept dept = deptId == null ? null : deptMapper.selectById(deptId);
        return dept == null ? null : dept.getDeptName();
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
