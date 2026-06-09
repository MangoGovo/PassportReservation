package com.campus.passportreservation.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.passportreservation.common.BusinessException;
import com.campus.passportreservation.common.PageResponse;
import com.campus.passportreservation.dto.AuthDtos.AdminCreateRequest;
import com.campus.passportreservation.dto.AuthDtos.AdminListItem;
import com.campus.passportreservation.entity.SysAdmin;
import com.campus.passportreservation.entity.SysAdminRole;
import com.campus.passportreservation.enums.AccountStatus;
import com.campus.passportreservation.mapper.SysAdminMapper;
import com.campus.passportreservation.mapper.SysAdminRoleMapper;
import com.campus.passportreservation.util.MaskingUtils;
import com.campus.passportreservation.util.ValidationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final SysAdminMapper adminMapper;
    private final SysAdminRoleMapper adminRoleMapper;
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
        return PageResponse.of(result, result.getRecords().stream().map(this::toListItem).toList());
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
        return new AdminListItem(admin.getId(), admin.getAdminNo(), admin.getRealName(), admin.getLoginName(),
                admin.getDeptId(), MaskingUtils.maskPhone(phone), admin.getAccountStatus(), admin.getAuthScope(),
                admin.getPasswordUpdatedAt());
    }
}
