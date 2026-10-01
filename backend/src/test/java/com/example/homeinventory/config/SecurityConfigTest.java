package com.example.homeinventory.config;

import com.example.homeinventory.controller.AuthController;
import com.example.homeinventory.controller.ItemController;
import com.example.homeinventory.service.ItemService;
import com.example.homeinventory.dto.AuthenticatedUserResponse;
import com.example.homeinventory.service.AccountDeletionService;
import com.example.homeinventory.service.AppUserService;
import com.example.homeinventory.service.HouseholdAccessService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({AuthController.class, ItemController.class})
@Import({SecurityConfig.class, SecurityConfigTest.OidcClientTestConfig.class})
class SecurityConfigTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppUserService appUserService;

    @MockitoBean
    private AccountDeletionService accountDeletionService;

    @MockitoBean
    private HouseholdAccessService householdAccessService;

    @MockitoBean
    private ItemService itemService;

    @Test
    @org.springframework.test.annotation.DirtiesContext(methodMode = org.springframework.test.annotation.DirtiesContext.MethodMode.AFTER_METHOD)
    void throttlesUploadsBeforeTheControllerAndKeepsOtherUsersIndependent() throws Exception {
        for (int i = 0; i < 20; i++) {
            mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart(
                            org.springframework.http.HttpMethod.PUT, "/api/items/123/photo")
                            .file("file", new byte[]{1, 2, 3})
                            .with(oidcLogin().idToken(token -> token.subject("upload-user"))).with(csrf()))
                    .andExpect(status().isOk());
        }
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart(
                        org.springframework.http.HttpMethod.PUT, "/api/items/124/photo")
                        .file("file", new byte[]{1, 2, 3})
                        .with(oidcLogin().idToken(token -> token.subject("upload-user"))).with(csrf()))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
        org.mockito.Mockito.verify(itemService, org.mockito.Mockito.times(20)).updatePhoto(
                org.mockito.ArgumentMatchers.eq(123L), any());
        org.mockito.Mockito.verify(itemService, org.mockito.Mockito.never()).updatePhoto(
                org.mockito.ArgumentMatchers.eq(124L), any());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart(
                        org.springframework.http.HttpMethod.PUT, "/api/items/124/photo")
                        .file("file", new byte[]{1, 2, 3})
                        .with(oidcLogin().idToken(token -> token.subject("other-upload-user"))).with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void throttlesPublicRequestsBeforeOAuthRedirectAndExposesRetryAfterThroughCors() throws Exception {
        for (int i = 0; i < 20; i++) {
            mockMvc.perform(get("/oauth2/authorization/google")
                            .with(request -> { request.setRemoteAddr("192.0.2.50"); return request; }))
                    .andExpect(status().is3xxRedirection());
        }
        mockMvc.perform(get("/oauth2/authorization/google")
                        .header("Origin", "http://localhost:5173")
                        .with(request -> { request.setRemoteAddr("192.0.2.50"); return request; }))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(header().string("Access-Control-Expose-Headers", "Retry-After"))
                .andExpect(jsonPath("$.message").value("Too many requests. Please try again later."));
        mockMvc.perform(get("/oauth2/authorization/google")
                        .with(request -> { request.setRemoteAddr("192.0.2.51"); return request; }))
                .andExpect(status().is3xxRedirection());
    }

    @Test
    void rejectsAnonymousApiRequestWithUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void providesCsrfTokenBeforeAuthentication() throws Exception {
        mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headerName").value("X-XSRF-TOKEN"))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Content-Security-Policy",
                        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"));
    }

    @Test
    void returnsLocalProfileForAuthenticatedOidcUser() throws Exception {
        when(appUserService.getProfile(any())).thenReturn(new AuthenticatedUserResponse(
                1L,
                "person@example.com",
                "Person Example",
                null,
                1L,
                "Our home",
                com.example.homeinventory.entity.HouseholdRole.OWNER,
                List.of()));

        mockMvc.perform(get("/api/auth/me").with(oidcLogin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("person@example.com"))
                .andExpect(jsonPath("$.displayName").value("Person Example"))
                .andExpect(jsonPath("$.householdName").value("Our home"));
    }

    @Test
    void protectsLogoutWithCsrf() throws Exception {
        mockMvc.perform(post("/api/auth/logout").with(oidcLogin()))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/auth/logout").with(oidcLogin()).with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void protectsAccountDeletionWithCsrf() throws Exception {
        mockMvc.perform(delete("/api/auth/account").with(oidcLogin()))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/auth/account").with(oidcLogin()).with(csrf()))
                .andExpect(status().isNoContent());
    }

    @TestConfiguration
    static class OidcClientTestConfig {
        @Bean
        ClientRegistrationRepository clientRegistrationRepository() {
            ClientRegistration google = ClientRegistration.withRegistrationId("google")
                    .clientId("test-client")
                    .clientSecret("test-secret")
                    .clientName("Google")
                    .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .scope("openid", "profile", "email")
                    .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                    .tokenUri("https://oauth2.googleapis.com/token")
                    .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                    .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
                    .userNameAttributeName(IdTokenClaimNames.SUB)
                    .build();
            return new InMemoryClientRegistrationRepository(google);
        }
    }
}
