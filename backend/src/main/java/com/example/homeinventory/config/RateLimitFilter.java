package com.example.homeinventory.config;

import com.example.homeinventory.dto.ApiErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.filter.OncePerRequestFilter;

import static com.example.homeinventory.config.RequestRateLimiter.Rule;

/** Registered only inside Spring Security, at separate public and authenticated stages. */
public class RateLimitFilter extends OncePerRequestFilter {
    private final RequestRateLimiter limiter;
    private final boolean publicRoutes;
    private final ObjectMapper objectMapper;

    public RateLimitFilter(RequestRateLimiter limiter, boolean publicRoutes, ObjectMapper objectMapper) {
        this.limiter = limiter;
        this.publicRoutes = publicRoutes;
        this.objectMapper = objectMapper;
    }

    @Override
    protected String getAlreadyFilteredAttributeName() {
        return getClass().getName() + "." + publicRoutes + ".FILTERED";
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        Rule rule = rule(request.getMethod(), path);
        String identity = request.getRemoteAddr();
        if (rule != null && !publicRoutes) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !(authentication.getPrincipal() instanceof OidcUser user)) {
                rule = null;
            } else {
                // Match the application's stable account identity; email/name can change.
                identity = user.getIssuer() + "|" + user.getSubject();
            }
        }
        if (rule != null) {
            long retryAfter = limiter.retryAfter(rule, identity);
            if (retryAfter > 0) {
                response.setStatus(429);
                response.setHeader("Retry-After", Long.toString(retryAfter));
                response.setHeader("Cache-Control", "no-store");
                response.setContentType("application/json");
                objectMapper.writeValue(response.getWriter(), new ApiErrorResponse(
                        Instant.now(), 429, "Too Many Requests",
                        "Too many requests. Please try again later.", Map.of()));
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private Rule rule(String method, String path) {
        if ("OPTIONS".equals(method)) {
            return null;
        }
        if (publicRoutes) {
            return path.equals("/oauth2") || path.startsWith("/oauth2/")
                    || path.equals("/login") || path.startsWith("/login/")
                    || path.equals("/api/auth/csrf") ? Rule.PUBLIC_AUTH : null;
        }
        if (("PUT".equals(method) && path.matches("/api/items/[^/]+/photo/?"))
                || ("POST".equals(method)
                && (path.equals("/api/household/import") || path.equals("/api/household/import/preview")))) {
            return Rule.UPLOAD;
        }
        if (("POST".equals(method) && path.matches("/api/household/invitations/?"))
                || ("POST".equals(method) && path.matches("/api/invitations/[^/]+/accept/?"))
                || ("DELETE".equals(method) && path.matches("/api/(household/)?invitations/[^/]+/?"))) {
            return Rule.INVITATION;
        }
        return null;
    }
}
