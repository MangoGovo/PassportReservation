package com.campus.passportreservation.service;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.campus.passportreservation.common.BusinessException;
import com.campus.passportreservation.config.AppSecurityProperties;
import com.campus.passportreservation.dto.AuthDtos.AdminLoginRequest;
import com.campus.passportreservation.dto.AuthDtos.ChangePasswordRequest;
import com.campus.passportreservation.dto.AuthDtos.LoginResponse;
import com.campus.passportreservation.dto.AuthDtos.LoginStatusResponse;
import com.campus.passportreservation.dto.AuthDtos.MobileLoginRequest;
import com.campus.passportreservation.dto.AuthDtos.MobileRegisterRequest;
import com.campus.passportreservation.entity.MobileUser;
import com.campus.passportreservation.entity.SysAdmin;
import com.campus.passportreservation.enums.AccountStatus;
import com.campus.passportreservation.mapper.MobileUserMapper;
import com.campus.passportreservation.mapper.SysAdminMapper;
import com.campus.passportreservation.security.LoginContext;
import com.campus.passportreservation.util.ValidationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final MobileUserMapper mobileUserMapper;
    private final SysAdminMapper adminMapper;
    private final PasswordEncoder passwordEncoder;
    private final CryptoService cryptoService;
    private final AppSecurityProperties securityProperties;
    private final AuditLogService auditLogService;
    private final StringRedisTemplate redisTemplate;

    @Transactional
    public LoginResponse register(MobileRegisterRequest request) {
        String phone = request.normalizedPhone();
        if (!ValidationUtils.isPhone(phone)) {
            throw new BusinessException("手机号格式错误");
        }
        if (!ValidationUtils.isStrongPassword(request.password())) {
            throw new BusinessException("密码需不少于 8 位，并包含数字、大小写字母和特殊字符");
        }
        String phoneHash = cryptoService.queryHash(phone);
        Long duplicate = mobileUserMapper.selectCount(new LambdaQueryWrapper<MobileUser>()
                .eq(MobileUser::getPhoneHash, phoneHash));
        if (duplicate > 0) {
            throw new BusinessException("手机号已注册");
        }
        String idCard = request.idCard();
        if (idCard != null && !idCard.isBlank() && !ValidationUtils.isIdCard(idCard)) {
            throw new BusinessException("身份证号格式错误");
        }
        LocalDateTime now = LocalDateTime.now();
        MobileUser user = new MobileUser();
        user.setPhoneCipher(cryptoService.encrypt(phone));
        user.setPhoneHash(phoneHash);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setName(request.normalizedName());
        user.setIdCardCipher(cryptoService.encrypt(idCard));
        user.setIdCardHash(cryptoService.queryHash(idCard));
        user.setAccountStatus(AccountStatus.NORMAL.name());
        user.setLoginFailCount(0);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        user.setDeleted(0);
        mobileUserMapper.insert(user);
        StpUtil.login(LoginContext.mobileLoginId(user.getId()));
        auditLogService.record("MOBILE_REGISTER", "mobile_user", user.getId(), "SUCCESS", null);
        return loginResponse(user.getId(), "MOBILE", user.getName(), false);
    }

    @Transactional
    public LoginResponse mobileLogin(MobileLoginRequest request) {
        String phone = request.normalizedPhone();
        if (!ValidationUtils.isPhone(phone)) {
            throw new BusinessException("手机号格式错误");
        }
        MobileUser user = mobileUserMapper.selectOne(new LambdaQueryWrapper<MobileUser>()
                .eq(MobileUser::getPhoneHash, cryptoService.queryHash(phone)));
        if (user == null) {
            auditLogService.record("MOBILE_LOGIN", "mobile_user", phone, "FAIL", "账号不存在");
            throw new BusinessException("手机号或密码错误");
        }
        ensureUsable(user.getAccountStatus(), user.getLockUntil());
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            failMobileLogin(user);
            auditLogService.record("MOBILE_LOGIN", "mobile_user", user.getId(), "FAIL", "密码错误");
            throw new BusinessException("手机号或密码错误");
        }
        user.setLoginFailCount(0);
        user.setLockUntil(null);
        user.setAccountStatus(AccountStatus.NORMAL.name());
        user.setUpdatedAt(LocalDateTime.now());
        mobileUserMapper.updateById(user);
        clearAttempt("mobile", user.getPhoneHash());
        StpUtil.login(LoginContext.mobileLoginId(user.getId()));
        auditLogService.record("MOBILE_LOGIN", "mobile_user", user.getId(), "SUCCESS", null);
        return loginResponse(user.getId(), "MOBILE", user.getName(), false);
    }

    @Transactional
    public LoginResponse adminLogin(AdminLoginRequest request) {
        SysAdmin admin = adminMapper.selectOne(new LambdaQueryWrapper<SysAdmin>()
                .eq(SysAdmin::getLoginName, request.loginName()));
        if (admin == null) {
            auditLogService.record("ADMIN_LOGIN", "sys_admin", request.loginName(), "FAIL", "账号不存在");
            throw new BusinessException("登录名或密码错误");
        }
        ensureUsable(admin.getAccountStatus(), admin.getLockUntil());
        if (!passwordEncoder.matches(request.password(), admin.getPasswordHash())) {
            failAdminLogin(admin);
            auditLogService.record("ADMIN_LOGIN", "sys_admin", admin.getId(), "FAIL", "密码错误");
            throw new BusinessException("登录名或密码错误");
        }
        admin.setLoginFailCount(0);
        admin.setLockUntil(null);
        admin.setAccountStatus(AccountStatus.NORMAL.name());
        admin.setUpdatedAt(LocalDateTime.now());
        adminMapper.updateById(admin);
        clearAttempt("admin", admin.getLoginName());
        StpUtil.login(LoginContext.adminLoginId(admin.getId()));
        boolean expired = admin.getPasswordUpdatedAt() == null
                || admin.getPasswordUpdatedAt().plusDays(securityProperties.getAdminPasswordExpireDays()).isBefore(LocalDateTime.now());
        auditLogService.record("ADMIN_LOGIN", "sys_admin", admin.getId(), "SUCCESS", null);
        return loginResponse(admin.getId(), "ADMIN", admin.getRealName(), expired);
    }

    @Transactional
    public void changeAdminPassword(ChangePasswordRequest request) {
        Long adminId = LoginContext.requireAdminId();
        SysAdmin admin = adminMapper.selectById(adminId);
        if (admin == null || !passwordEncoder.matches(request.oldPassword(), admin.getPasswordHash())) {
            throw new BusinessException("原密码错误");
        }
        if (!ValidationUtils.isStrongPassword(request.newPassword())) {
            throw new BusinessException("新密码需不少于 8 位，并包含数字、大小写字母和特殊字符");
        }
        admin.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        admin.setPasswordUpdatedAt(LocalDateTime.now());
        admin.setUpdatedAt(LocalDateTime.now());
        adminMapper.updateById(admin);
        auditLogService.record("ADMIN_PASSWORD_CHANGE", "sys_admin", adminId, "SUCCESS", null);
    }

    public LoginStatusResponse status() {
        if (!StpUtil.isLogin()) {
            return new LoginStatusResponse(false, null, null, null);
        }
        String loginId = StpUtil.getLoginIdAsString();
        if (loginId.startsWith(LoginContext.MOBILE_PREFIX)) {
            Long id = LoginContext.requireMobileId();
            MobileUser user = mobileUserMapper.selectById(id);
            return new LoginStatusResponse(true, "MOBILE", id, user == null ? null : user.getName());
        }
        if (loginId.startsWith(LoginContext.ADMIN_PREFIX)) {
            Long id = LoginContext.requireAdminId();
            SysAdmin admin = adminMapper.selectById(id);
            return new LoginStatusResponse(true, "ADMIN", id, admin == null ? null : admin.getRealName());
        }
        return new LoginStatusResponse(false, null, null, null);
    }

    public void logout(String operationType) {
        Object loginId = StpUtil.isLogin() ? StpUtil.getLoginId() : null;
        StpUtil.logout();
        auditLogService.record(operationType, "session", loginId, "SUCCESS", null);
    }

    public SysAdmin currentAdmin() {
        return adminMapper.selectById(LoginContext.requireAdminId());
    }

    public MobileUser currentMobileUser() {
        return mobileUserMapper.selectById(LoginContext.requireMobileId());
    }

    private LoginResponse loginResponse(Long userId, String userType, String displayName, boolean passwordExpired) {
        return new LoginResponse(userId, "Authorization", StpUtil.getTokenValue(), userType, displayName,
                StpUtil.getRoleList(), StpUtil.getPermissionList(), passwordExpired);
    }

    private void ensureUsable(String status, LocalDateTime lockUntil) {
        if (AccountStatus.DISABLED.name().equals(status) || AccountStatus.DELETED.name().equals(status)) {
            throw new BusinessException("账号不可用");
        }
        if (lockUntil != null && lockUntil.isAfter(LocalDateTime.now())) {
            throw new BusinessException("账号已锁定，请稍后再试");
        }
    }

    private void failMobileLogin(MobileUser user) {
        int failures = incrementAttempt("mobile", user.getPhoneHash());
        applyFailure(user, failures);
        mobileUserMapper.updateById(user);
    }

    private void failAdminLogin(SysAdmin admin) {
        int failures = incrementAttempt("admin", admin.getLoginName());
        applyFailure(admin, failures);
        adminMapper.updateById(admin);
    }

    private void applyFailure(MobileUser user, int redisFailures) {
        int failures = redisFailures > 0 ? redisFailures : nullToZero(user.getLoginFailCount()) + 1;
        user.setLoginFailCount(failures);
        user.setUpdatedAt(LocalDateTime.now());
        if (failures >= securityProperties.getMaxLoginFailures()) {
            user.setAccountStatus(AccountStatus.LOCKED.name());
            user.setLockUntil(LocalDateTime.now().plusMinutes(securityProperties.getLockMinutes()));
        }
    }

    private void applyFailure(SysAdmin admin, int redisFailures) {
        int failures = redisFailures > 0 ? redisFailures : nullToZero(admin.getLoginFailCount()) + 1;
        admin.setLoginFailCount(failures);
        admin.setUpdatedAt(LocalDateTime.now());
        if (failures >= securityProperties.getMaxLoginFailures()) {
            admin.setAccountStatus(AccountStatus.LOCKED.name());
            admin.setLockUntil(LocalDateTime.now().plusMinutes(securityProperties.getLockMinutes()));
        }
    }

    private int incrementAttempt(String namespace, String identity) {
        String key = "login:fail:" + namespace + ":" + identity;
        try {
            Long value = redisTemplate.opsForValue().increment(key);
            redisTemplate.expire(key, Duration.ofMinutes(securityProperties.getLockMinutes()));
            return value == null ? -1 : value.intValue();
        } catch (Exception exception) {
            return -1;
        }
    }

    private void clearAttempt(String namespace, String identity) {
        try {
            redisTemplate.delete("login:fail:" + namespace + ":" + identity);
        } catch (Exception ignored) {
        }
    }

    private int nullToZero(Integer value) {
        return value == null ? 0 : value;
    }
}
