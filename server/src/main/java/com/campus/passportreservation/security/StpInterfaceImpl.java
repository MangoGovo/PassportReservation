package com.campus.passportreservation.security;

import cn.dev33.satoken.stp.StpInterface;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.campus.passportreservation.entity.SysAdminRole;
import com.campus.passportreservation.entity.SysPermission;
import com.campus.passportreservation.entity.SysRole;
import com.campus.passportreservation.entity.SysRolePermission;
import com.campus.passportreservation.mapper.SysAdminRoleMapper;
import com.campus.passportreservation.mapper.SysPermissionMapper;
import com.campus.passportreservation.mapper.SysRoleMapper;
import com.campus.passportreservation.mapper.SysRolePermissionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class StpInterfaceImpl implements StpInterface {

    private final SysAdminRoleMapper adminRoleMapper;
    private final SysRoleMapper roleMapper;
    private final SysRolePermissionMapper rolePermissionMapper;
    private final SysPermissionMapper permissionMapper;

    @Override
    public List<String> getPermissionList(Object loginId, String loginType) {
        String value = String.valueOf(loginId);
        if (value.startsWith(LoginContext.MOBILE_PREFIX)) {
            return List.of("mobile:reservation");
        }
        if (!value.startsWith(LoginContext.ADMIN_PREFIX)) {
            return Collections.emptyList();
        }
        List<Long> roleIds = roleIds(adminId(value));
        if (roleIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<Long> permissionIds = rolePermissionMapper.selectList(new LambdaQueryWrapper<SysRolePermission>()
                        .in(SysRolePermission::getRoleId, roleIds))
                .stream()
                .map(SysRolePermission::getPermissionId)
                .distinct()
                .toList();
        if (permissionIds.isEmpty()) {
            return Collections.emptyList();
        }
        return permissionMapper.selectList(new LambdaQueryWrapper<SysPermission>()
                        .in(SysPermission::getId, permissionIds))
                .stream()
                .map(SysPermission::getPermissionCode)
                .distinct()
                .toList();
    }

    @Override
    public List<String> getRoleList(Object loginId, String loginType) {
        String value = String.valueOf(loginId);
        if (value.startsWith(LoginContext.MOBILE_PREFIX)) {
            return List.of("MOBILE_USER");
        }
        if (!value.startsWith(LoginContext.ADMIN_PREFIX)) {
            return Collections.emptyList();
        }
        List<Long> roleIds = roleIds(adminId(value));
        if (roleIds.isEmpty()) {
            return Collections.emptyList();
        }
        return roleMapper.selectList(new LambdaQueryWrapper<SysRole>().in(SysRole::getId, roleIds))
                .stream()
                .map(SysRole::getRoleCode)
                .distinct()
                .toList();
    }

    public Set<String> getAdminRoleSet(Long adminId) {
        List<Long> roleIds = roleIds(adminId);
        if (roleIds.isEmpty()) {
            return Collections.emptySet();
        }
        return roleMapper.selectList(new LambdaQueryWrapper<SysRole>().in(SysRole::getId, roleIds))
                .stream()
                .map(SysRole::getRoleCode)
                .collect(Collectors.toSet());
    }

    private List<Long> roleIds(Long adminId) {
        return adminRoleMapper.selectList(new LambdaQueryWrapper<SysAdminRole>()
                        .eq(SysAdminRole::getAdminId, adminId))
                .stream()
                .map(SysAdminRole::getRoleId)
                .distinct()
                .toList();
    }

    private Long adminId(String loginId) {
        return Long.parseLong(loginId.substring(LoginContext.ADMIN_PREFIX.length()));
    }
}
