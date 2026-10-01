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
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import static com.example.homeinventory.config.RequestRateLimiter.Rule;
import static org.springframework.http.HttpMethod.DELETE;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.http.HttpMethod.PUT;

/** Registered only inside Spring Security, at separate public and authenticated stages. */
public class RateLimitFilter extends OncePerRequestFilter {
    // Use the same segment decoding as Spring MVC, including percent-encoded letters.
    private static final PathPatternRequestMatcher.Builder PATHS = PathPatternRequestMatcher.withDefaults();
    private static final RequestMatcher PUBLIC_AUTH_PATHS = new OrRequestMatcher(
            PATHS.matcher("/oauth2/**"), PATHS.matcher("/login/**"), PATHS.matcher("/api/auth/csrf"));
    private static final RequestMatcher UPLOAD_PATHS = new OrRequestMatcher(
            PATHS.matcher(PUT, "/api/items/{id}/photo"),
            PATHS.matcher(POST, "/api/household/import"),
            PATHS.matcher(POST, "/api/household/import/preview"));
    private static final RequestMatcher INVITATION_PATHS = new OrRequestMatcher(
            PATHS.matcher(POST, "/api/household/invitations"),
            PATHS.matcher(POST, "/api/invitations/{id}/accept"),
            PATHS.matcher(DELETE, "/api/invitations/{id}"),
            PATHS.matcher(DELETE, "/api/household/invitations/{id}"));
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
        Rule rule = rule(request);
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

    private Rule rule(HttpServletRequest request) {
        if ("OPTIONS".equals(request.getMethod())) {
            return null;
        }
        if (publicRoutes) {
            return PUBLIC_AUTH_PATHS.matches(request) ? Rule.PUBLIC_AUTH : null;
        }
        if (UPLOAD_PATHS.matches(request)) {
            return Rule.UPLOAD;
        }
        if (INVITATION_PATHS.matches(request)) {
            return Rule.INVITATION;
        }
        return null;
    }
}
