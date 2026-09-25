package com.example.homeinventory.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;
import java.net.URI;
import java.util.Locale;

@ConfigurationProperties(prefix = "app.auth")
public record AuthProperties(String frontendUrl) {
    public AuthProperties {
        frontendUrl = normalizeFrontendUrl(frontendUrl);
    }

    private static String normalizeFrontendUrl(String value) {
        String candidate = StringUtils.hasText(value) ? value.trim() : "http://localhost:5173";
        try {
            URI uri = URI.create(candidate);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            if (!(scheme.equals("http") || scheme.equals("https"))
                    || !StringUtils.hasText(uri.getRawAuthority())
                    || uri.getRawUserInfo() != null
                    || uri.getRawQuery() != null
                    || uri.getRawFragment() != null
                    || (StringUtils.hasText(uri.getRawPath()) && !uri.getRawPath().equals("/"))) {
                throw new IllegalArgumentException();
            }
            return scheme + "://" + uri.getRawAuthority();
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException(
                    "app.auth.frontend-url must be an http(s) origin without a path, query, or fragment", ex);
        }
    }
}
