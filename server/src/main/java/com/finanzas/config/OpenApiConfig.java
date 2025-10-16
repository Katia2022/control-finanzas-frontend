package com.finanzas.config;

import com.finanzas.common.Constants;
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
                        .title(Constants.API_TITLE)
                        .version(Constants.API_VERSION)
                        .description(Constants.API_DESCRIPTION));
    }
}

