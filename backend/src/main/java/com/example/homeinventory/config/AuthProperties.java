package com.example.homeinventory.config;

import java.util.List;
import java.util.Locale;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "app.auth")
public record AuthProperties(String frontendUrl, List<String> allowedEmails) {
    public AuthProperties {
        frontendUrl = StringUtils.hasText(frontendUrl)
                ? frontendUrl.replaceAll("/+$", "")
                : "http://localhost:5173";
        allowedEmails = allowedEmails == null
                ? List.of()
                : allowedEmails.stream()
                        .filter(StringUtils::hasText)
                        .map(email -> email.trim().toLowerCase(Locale.ROOT))
                        .distinct()
                        .toList();
    }
}
