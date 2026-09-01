package com.example.homeinventory.config;

import com.example.homeinventory.controller.InvitationController;
import com.example.homeinventory.dto.AuthenticatedUserResponse;
import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.service.AppUserService;
import com.example.homeinventory.service.InvitationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InvitationController.class)
@Import({SecurityConfig.class, SecurityConfigTest.OidcClientTestConfig.class})
class InvitationControllerSecurityTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppUserService appUserService;

    @MockitoBean
    private InvitationService invitationService;

    @Test
    void letsAuthenticatedHouseholdlessUserAcceptAnInvitation() throws Exception {
        when(invitationService.accept(any(), eq(23L))).thenReturn(new AuthenticatedUserResponse(
                1L, "person@example.com", "Person Example", null,
                4L, "Our home", HouseholdRole.MEMBER, null));

        mockMvc.perform(post("/api/invitations/23/accept").with(oidcLogin()).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.householdId").value(4));

        verify(invitationService).accept(any(), eq(23L));
        verify(appUserService, never()).getRequired(any());
    }

    @Test
    void letsAuthenticatedHouseholdlessUserRejectAnInvitation() throws Exception {
        when(invitationService.reject(any(), eq(23L))).thenReturn(new AuthenticatedUserResponse(
                1L, "person@example.com", "Person Example", null,
                null, null, null, null));

        mockMvc.perform(delete("/api/invitations/23").with(oidcLogin()).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.householdId").doesNotExist())
                .andExpect(jsonPath("$.pendingInvitation").doesNotExist());

        verify(invitationService).reject(any(), eq(23L));
        verify(appUserService, never()).getRequired(any());
    }

    @Test
    void invitationDecisionRequiresAuthenticationAndCsrf() throws Exception {
        mockMvc.perform(post("/api/invitations/23/accept").with(oidcLogin()))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/invitations/23/accept").with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void stillBlocksHouseholdlessUsersFromHouseholdApis() throws Exception {
        when(appUserService.getRequired(any())).thenReturn(new AppUser(
                "https://accounts.google.com", "subject", "person@example.com", "Person Example", null));

        mockMvc.perform(get("/api/items").with(oidcLogin()))
                .andExpect(status().isForbidden());
    }
}
