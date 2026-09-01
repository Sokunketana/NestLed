package com.example.homeinventory.config;

import com.example.homeinventory.controller.AuthController;
import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.service.AppUserService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, SecurityConfigTest.OidcClientTestConfig.class})
class SecurityConfigTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppUserService appUserService;

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
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void returnsLocalProfileForAuthenticatedOidcUser() throws Exception {
        when(appUserService.getRequired(any())).thenReturn(new AppUser(
                "https://accounts.google.com",
                "subject-123",
                "person@example.com",
                "Person Example",
                null));

        mockMvc.perform(get("/api/auth/me").with(oidcLogin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("person@example.com"))
                .andExpect(jsonPath("$.displayName").value("Person Example"));
    }

    @Test
    void protectsLogoutWithCsrf() throws Exception {
        mockMvc.perform(post("/api/auth/logout").with(oidcLogin()))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/auth/logout").with(oidcLogin()).with(csrf()))
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
