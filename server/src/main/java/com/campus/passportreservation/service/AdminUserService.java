package com.campus.passportreservation.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.passportreservation.common.BusinessException;
import com.campus.passportreservation.common.PageResponse;
import com.campus.passportreservation.dto.AuthDtos.AdminCreateRequest;
import com.campus.passportreservation.dto.AuthDtos.AdminListItem;
import com.campus.passportreservation.dto.AuthDtos.AdminPasswordResetRequest;
import com.campus.passportreservation.dto.AuthDtos.AdminStatusRequest;
import com.campus.passportreservation.dto.AuthDtos.AdminUpdateRequest;
import com.campus.passportreservation.dto.AuthDtos.RoleOption;
import com.campus.passportreservation.entity.SysAdmin;
import com.campus.passportreservation.entity.SysAdminRole;
import com.campus.passportreservation.entity.SysRole;
import com.campus.passportreservation.enums.AccountStatus;
import com.campus.passportreservation.mapper.SysAdminMapper;
import com.campus.passportreservation.mapper.SysAdminRoleMapper;
import com.campus.passportreservation.mapper.SysRoleMapper;
import com.campus.passportreservation.util.MaskingUtils;
import com.campus.passportreservation.util.ValidationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final SysAdminMapper adminMapper;
    private final SysAdminRoleMapper adminRoleMapper;
    private final SysRoleMapper roleMapper;
    private final PasswordEncoder passwordEncoder;
    private final CryptoService cryptoService;
    private final AuditLogService auditLogService;

    public PageResponse<AdminListItem> list(String keyword, Long page, Long size) {
        Page<SysAdmin> request = Page.of(page == null || page < 1 ? 1 : page, size == null || size < 1 ? 20 : Math.min(size, 100));
        Page<SysAdmin> result = adminMapper.selectPage(request, new LambdaQueryWrapper<SysAdmin>()
                .and(keyword != null && !keyword.isBlank(), wrapper -> wrapper
                        .like(SysAdmin::getRealName, keyword)
                        .or()
                        .like(SysAdmin::getLoginName, keyword))
                .orderByDesc(SysAdmin::getCreatedAt));
        return PageResponse.of(result, toListItems(result.getRecords()));
    }

    public AdminListItem detail(Long id) {
        SysAdmin admin = adminMapper.selectById(id);
        if (admin == null) {
            throw new BusinessException("管理员不存在");
        }
        return toListItem(admin);
    }

    public List<RoleOption> roles() {
        return roleMapper.selectList(new LambdaQueryWrapper<SysRole>().orderByAsc(SysRole::getId))
                .stream()
                .map(role -> new RoleOption(role.getId(), role.getRoleCode(), role.getRoleName()))
                .toList();
    }

    @Transactional
    public AdminListItem create(AdminCreateRequest request) {
        if (!ValidationUtils.isStrongPassword(request.password())) {
            throw new BusinessException("密码需不少于 8 位，并包含数字、大小写字母和特殊字符");
        }
        if (request.phone() != null && !request.phone().isBlank() && !ValidationUtils.isPhone(request.phone())) {
            throw new BusinessException("手机号格式错误");
        }
        Long duplicate = adminMapper.selectCount(new LambdaQueryWrapper<SysAdmin>()
                .eq(SysAdmin::getLoginName, request.loginName()));
        if (duplicate > 0) {
            throw new BusinessException("登录名已存在");
        }
        LocalDateTime now = LocalDateTime.now();
        SysAdmin admin = new SysAdmin();
        admin.setAdminNo("A" + System.currentTimeMillis());
        admin.setRealName(request.realName());
        admin.setLoginName(request.loginName());
        admin.setPasswordHash(passwordEncoder.encode(request.password()));
        admin.setDeptId(request.deptId());
        admin.setPhoneCipher(cryptoService.encrypt(request.phone()));
        admin.setPhoneHash(cryptoService.queryHash(request.phone()));
        admin.setAccountStatus(AccountStatus.NORMAL.name());
        admin.setAuthScope(request.authScope());
        admin.setLoginFailCount(0);
        admin.setPasswordUpdatedAt(now);
        admin.setCreatedAt(now);
        admin.setUpdatedAt(now);
        admin.setDeleted(0);
        adminMapper.insert(admin);
        saveRoles(admin.getId(), request.roleIds());
        auditLogService.record("ADMIN_CREATE", "sys_admin", admin.getId(), "SUCCESS", request);
        return toListItem(admin);
    }

    @Transactional
    public AdminListItem update(Long id, AdminUpdateRequest request) {
        SysAdmin admin = adminMapper.selectById(id);
        if (admin == null) {
            throw new BusinessException("管理员不存在");
        }
        if (request.phone() != null && !request.phone().isBlank() && !ValidationUtils.isPhone(request.phone())) {
            throw new BusinessException("手机号格式错误");
        }
        Long duplicate = adminMapper.selectCount(new LambdaQueryWrapper<SysAdmin>()
                .eq(SysAdmin::getLoginName, request.loginName())
                .ne(SysAdmin::getId, id));
        if (duplicate > 0) {
            throw new BusinessException("登录名已存在");
        }
        admin.setRealName(request.realName());
        admin.setLoginName(request.loginName());
        admin.setDeptId(request.deptId());
        admin.setPhoneCipher(cryptoService.encrypt(request.phone()));
        admin.setPhoneHash(cryptoService.queryHash(request.phone()));
        admin.setAuthScope(request.authScope());
        admin.setAccountStatus(defaultStatus(request.accountStatus()));
        admin.setUpdatedAt(LocalDateTime.now());
        adminMapper.updateById(admin);
        saveRoles(id, request.roleIds());
        auditLogService.record("ADMIN_UPDATE", "sys_admin", id, "SUCCESS", request);
        return toListItem(admin);
    }

    @Transactional
    public AdminListItem resetPassword(Long id, AdminPasswordResetRequest request) {
        if (!ValidationUtils.isStrongPassword(request.newPassword())) {
            throw new BusinessException("密码需不少于 8 位，并包含数字、大小写字母和特殊字符");
        }
        SysAdmin admin = adminMapper.selectById(id);
        if (admin == null) {
            throw new BusinessException("管理员不存在");
        }
        LocalDateTime now = LocalDateTime.now();
        admin.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        admin.setPasswordUpdatedAt(now);
        admin.setUpdatedAt(now);
        adminMapper.updateById(admin);
        auditLogService.record("ADMIN_PASSWORD_RESET", "sys_admin", id, "SUCCESS", null);
        return toListItem(admin);
    }

    @Transactional
    public AdminListItem updateStatus(Long id, AdminStatusRequest request) {
        SysAdmin admin = adminMapper.selectById(id);
        if (admin == null) {
            throw new BusinessException("管理员不存在");
        }
        admin.setAccountStatus(defaultStatus(request.accountStatus()));
        admin.setUpdatedAt(LocalDateTime.now());
        adminMapper.updateById(admin);
        auditLogService.record("ADMIN_STATUS_UPDATE", "sys_admin", id, "SUCCESS", request);
        return toListItem(admin);
    }

    @Transactional
    public void delete(Long id) {
        adminMapper.deleteById(id);
        auditLogService.record("ADMIN_DELETE", "sys_admin", id, "SUCCESS", null);
    }

    private void saveRoles(Long adminId, List<Long> roleIds) {
        if (roleIds == null) {
            return;
        }
        adminRoleMapper.delete(new LambdaQueryWrapper<SysAdminRole>().eq(SysAdminRole::getAdminId, adminId));
        for (Long roleId : roleIds) {
            SysAdminRole relation = new SysAdminRole();
            relation.setAdminId(adminId);
            relation.setRoleId(roleId);
            adminRoleMapper.insert(relation);
        }
    }

    private AdminListItem toListItem(SysAdmin admin) {
        String phone = cryptoService.decrypt(admin.getPhoneCipher());
        List<Long> roleIds = roleIds(admin.getId());
        Map<Long, String> roleCodeById = roleCodes(roleIds);
        return toListItem(admin, phone, roleIds, roleCodeById);
    }

    private List<AdminListItem> toListItems(List<SysAdmin> admins) {
        if (admins == null || admins.isEmpty()) {
            return List.of();
        }
        List<Long> adminIds = admins.stream()
                .map(SysAdmin::getId)
                .filter(Objects::nonNull)
                .toList();
        Map<Long, List<Long>> roleIdsByAdmin = adminIds.isEmpty()
                ? Map.of()
                : adminRoleMapper.selectList(new LambdaQueryWrapper<SysAdminRole>()
                                .in(SysAdminRole::getAdminId, adminIds))
                        .stream()
                        .collect(Collectors.groupingBy(SysAdminRole::getAdminId,
                                Collectors.mapping(SysAdminRole::getRoleId, Collectors.toList())));
        Set<Long> allRoleIds = roleIdsByAdmin.values()
                .stream()
                .flatMap(List::stream)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> roleCodeById = roleCodes(allRoleIds.stream().toList());
        return admins.stream()
                .map(admin -> toListItem(admin, cryptoService.decrypt(admin.getPhoneCipher()),
                        roleIdsByAdmin.getOrDefault(admin.getId(), List.of()), roleCodeById))
                .toList();
    }

    private AdminListItem toListItem(SysAdmin admin, String phone, List<Long> roleIds, Map<Long, String> roleCodeById) {
        List<String> roleCodes = roleIds.stream()
                .map(roleCodeById::get)
                .filter(Objects::nonNull)
                .toList();
        return new AdminListItem(admin.getId(), admin.getAdminNo(), admin.getRealName(), admin.getLoginName(),
                admin.getDeptId(), MaskingUtils.maskPhone(phone), admin.getAccountStatus(), admin.getAuthScope(),
                roleIds, roleCodes, admin.getPasswordUpdatedAt());
    }

    private Map<Long, String> roleCodes(List<Long> roleIds) {
        if (roleIds == null || roleIds.isEmpty()) {
            return Map.of();
        }
        return roleMapper.selectList(new LambdaQueryWrapper<SysRole>().in(SysRole::getId, roleIds))
                .stream()
                .collect(Collectors.toMap(SysRole::getId, SysRole::getRoleCode, (left, right) -> left));
    }

    private List<Long> roleIds(Long adminId) {
        return adminRoleMapper.selectList(new LambdaQueryWrapper<SysAdminRole>().eq(SysAdminRole::getAdminId, adminId))
                .stream()
                .map(SysAdminRole::getRoleId)
                .distinct()
                .toList();
    }

    private String defaultStatus(String status) {
        return status == null || status.isBlank() ? AccountStatus.NORMAL.name() : status;
    }
}
