package com.campus.passportreservation.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.router.SaRouter;
import cn.dev33.satoken.stp.StpUtil;
import com.campus.passportreservation.security.LoginContext;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(AppSecurityProperties.class)
public class SaTokenConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SaInterceptor(handler -> {
            SaRouter.match("/api/mobile/reservations/**", LoginContext::requireMobileId);

            SaRouter.match("/api/admin/**", r -> LoginContext.requireAdminId());

            SaRouter.match("/api/admin/departments/**", r -> StpUtil.checkPermission("dept:manage"));
            SaRouter.match("/api/admin/admins/**", r -> StpUtil.checkPermission("admin:manage"));
            SaRouter.match("/api/admin/public-reservations/**", r -> StpUtil.checkPermission("public:query"));
            SaRouter.match("/api/admin/official-reservations/**", r -> StpUtil.checkPermission("official:query"));
            SaRouter.match("/api/admin/official-reservations/*/approval", r -> StpUtil.checkPermission("official:review"));
            SaRouter.match("/api/admin/audit-logs/**", r -> StpUtil.checkPermission("audit:query"));
        })).addPathPatterns("/**")
                .excludePathPatterns(
                        "/api/mobile/auth/login",
                        "/api/mobile/auth/register",
                        "/api/mobile/auth/status",
                        "/api/admin/auth/login",
                        "/api/mobile/campuses",
                        "/api/mobile/departments",
                        "/actuator/**",
                        "/error"
                );
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Authorization")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
