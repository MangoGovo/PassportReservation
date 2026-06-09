package com.campus.passportreservation.security;

import cn.dev33.satoken.stp.StpUtil;
import com.campus.passportreservation.common.BusinessException;

public final class LoginContext {

    public static final String MOBILE_PREFIX = "MOBILE:";
    public static final String ADMIN_PREFIX = "ADMIN:";

    private LoginContext() {
    }

    public static String mobileLoginId(Long userId) {
        return MOBILE_PREFIX + userId;
    }

    public static String adminLoginId(Long adminId) {
        return ADMIN_PREFIX + adminId;
    }

    public static Long requireMobileId() {
        String loginId = requireLoginId();
        if (!loginId.startsWith(MOBILE_PREFIX)) {
            throw new BusinessException(403, "需要手机端用户登录");
        }
        return Long.parseLong(loginId.substring(MOBILE_PREFIX.length()));
    }

    public static Long requireAdminId() {
        String loginId = requireLoginId();
        if (!loginId.startsWith(ADMIN_PREFIX)) {
            throw new BusinessException(403, "需要后台管理员登录");
        }
        return Long.parseLong(loginId.substring(ADMIN_PREFIX.length()));
    }

    public static Long currentAdminIdOrNull() {
        if (!StpUtil.isLogin()) {
            return null;
        }
        String loginId = StpUtil.getLoginIdAsString();
        if (!loginId.startsWith(ADMIN_PREFIX)) {
            return null;
        }
        return Long.parseLong(loginId.substring(ADMIN_PREFIX.length()));
    }

    public static String currentLoginIdOrNull() {
        return StpUtil.isLogin() ? StpUtil.getLoginIdAsString() : null;
    }

    private static String requireLoginId() {
        StpUtil.checkLogin();
        return StpUtil.getLoginIdAsString();
    }
}
