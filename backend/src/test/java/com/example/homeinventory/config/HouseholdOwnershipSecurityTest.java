package com.example.homeinventory.config;

import com.example.homeinventory.controller.HouseholdController;
import com.example.homeinventory.service.AppUserService;
import com.example.homeinventory.service.HouseholdAccessService;
import com.example.homeinventory.service.HouseholdService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HouseholdController.class)
@Import({SecurityConfig.class, SecurityConfigTest.OidcClientTestConfig.class})
class HouseholdOwnershipSecurityTest {
    @Autowired MockMvc mvc;
    @MockitoBean HouseholdService households;
    @MockitoBean AppUserService appUsers;
    @MockitoBean HouseholdAccessService access;

    @Test
    void transferRequiresAuthenticationAndCsrf() throws Exception {
        mvc.perform(post("/api/household/ownership").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"memberId\":2}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/household/ownership").with(oidcLogin())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"memberId\":2}"))
                .andExpect(status().isForbidden());
        verifyNoInteractions(households);
    }

    @Test
    void transferRejectsMissingAndNonpositiveMemberIds() throws Exception {
        for (String body : new String[]{"{}", "{\"memberId\":null}", "{\"memberId\":0}", "{\"memberId\":-1}"}) {
            mvc.perform(post("/api/household/ownership").with(oidcLogin()).with(csrf())
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
        verifyNoInteractions(households);
    }

    @Test
    void transferPassesValidatedMemberIdAndAuthenticatedPrincipalToService() throws Exception {
        mvc.perform(post("/api/household/ownership").with(oidcLogin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"memberId\":2}"))
                .andExpect(status().isOk());
        verify(households).transferOwnership(any(), eq(2L));
    }
}
