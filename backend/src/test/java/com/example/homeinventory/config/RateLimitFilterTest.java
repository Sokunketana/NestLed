package com.example.homeinventory.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static com.example.homeinventory.config.RequestRateLimiter.Rule.*;

class RateLimitFilterTest {
    private final RequestRateLimiter limiter = mock(RequestRateLimiter.class);

    @AfterEach
    void clearContext() { SecurityContextHolder.clearContext(); }

    private void login(String subject) {
        OidcUser user = mock(OidcUser.class);
        when(user.getSubject()).thenReturn(subject);
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(user, null));
    }

    private MockHttpServletResponse request(boolean publicRoutes, String method, String path) throws Exception {
        var request = new MockHttpServletRequest(method, path);
        request.setRemoteAddr("192.0.2.1");
        request.addHeader("X-Forwarded-For", "spoofed-ip");
        var response = new MockHttpServletResponse();
        new RateLimitFilter(limiter, publicRoutes, new ObjectMapper().findAndRegisterModules())
                .doFilter(request, response, new MockFilterChain());
        return response;
    }

    @Test
    void limitsOAuthBeforeRedirectAndUsesResolvedRemoteAddress() throws Exception {
        when(limiter.retryAfter(PUBLIC_AUTH, "192.0.2.1")).thenReturn(3L);
        var response = request(true, "GET", "/oauth2/authorization/google");
        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isEqualTo("3");
        assertThat(response.getContentType()).startsWith("application/json");
        assertThat(response.getContentAsString()).contains("Too many requests");
        request(true, "GET", "/login/oauth2/code/google");
        request(true, "GET", "/api/auth/csrf");
        verify(limiter, times(3)).retryAfter(PUBLIC_AUTH, "192.0.2.1");
    }

    @Test
    void photoAndImportUploadsShareUserQuotaAcrossItemIds() throws Exception {
        login("alice");
        when(limiter.retryAfter(UPLOAD, "null|alice")).thenReturn(2L);
        assertThat(request(false, "PUT", "/api/items/1/photo").getStatus()).isEqualTo(429);
        assertThat(request(false, "PUT", "/api/items/2/photo").getStatus()).isEqualTo(429);
        assertThat(request(false, "POST", "/api/household/import").getStatus()).isEqualTo(429);
        assertThat(request(false, "POST", "/api/household/import/preview").getStatus()).isEqualTo(429);
        verify(limiter, times(4)).retryAfter(UPLOAD, "null|alice");
    }

    @Test
    void invitationCreationAndDecisionsShareUserQuota() throws Exception {
        login("alice");
        request(false, "POST", "/api/household/invitations");
        request(false, "POST", "/api/invitations/1/accept");
        request(false, "DELETE", "/api/invitations/1");
        request(false, "DELETE", "/api/household/invitations/1");
        verify(limiter, times(4)).retryAfter(INVITATION, "null|alice");
    }

    @Test
    void skipsPreflightOrdinaryReadsAndAnonymousOperations() throws Exception {
        request(false, "PUT", "/api/items/1/photo");
        login("alice");
        request(false, "GET", "/api/items/1/photo");
        request(false, "GET", "/api/items");
        request(true, "OPTIONS", "/oauth2/authorization/google");
        request(false, "OPTIONS", "/api/household/invitations");
        verifyNoInteractions(limiter);
    }
}
