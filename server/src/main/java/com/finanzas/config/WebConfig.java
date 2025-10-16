package com.finanzas.config;

import com.finanzas.common.Constants;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping(Constants.CORS_API_PATTERN)
                .allowedOriginPatterns(Constants.CORS_ALLOWED_ORIGIN_PATTERNS)
                .allowedMethods(Constants.CORS_ALLOWED_METHODS)
                .allowedHeaders("*")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
