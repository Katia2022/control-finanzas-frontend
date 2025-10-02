package com.finanzas.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI apiInfo() {
        return new OpenAPI()
                .components(new Components())
                .info(new Info()
                        .title("Control Finanzas API")
                        .version("0.1.0")
                        .description("API para cuentas y ahorro (iteración inicial)"));
    }
}

