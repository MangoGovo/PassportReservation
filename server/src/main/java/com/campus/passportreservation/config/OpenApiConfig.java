package com.campus.passportreservation.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    public static final String BEARER_AUTH = "BearerAuth";

    @Bean
    public OpenAPI passportReservationOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("校园通行码预约管理系统 API")
                        .description("移动端预约、后台审核管理、统计和审计接口")
                        .version("1.0.0"))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
                .schemaRequirement(BEARER_AUTH, new SecurityScheme()
                        .name("Authorization")
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("Sa-Token"));
    }
}
