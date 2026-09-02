package com.example.homeinventory.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "app.auth")
public record AuthProperties(String frontendUrl) {
    public AuthProperties {
        frontendUrl = StringUtils.hasText(frontendUrl)
                ? frontendUrl.replaceAll("/+$", "")
                : "http://localhost:5173";
    }
}
