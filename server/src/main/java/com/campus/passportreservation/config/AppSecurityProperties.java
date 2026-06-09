package com.campus.passportreservation.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.security")
public class AppSecurityProperties {

    private String sensitiveKey;

    private String queryHashSalt;

    private String auditHmacKey;

    private int maxLoginFailures = 5;

    private int lockMinutes = 30;

    private int adminPasswordExpireDays = 90;
}
