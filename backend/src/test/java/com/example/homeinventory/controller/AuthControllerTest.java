package com.example.homeinventory.controller;

import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.service.AccountDeletionService;
import com.example.homeinventory.service.AppUserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class AuthControllerTest {
    private final AccountDeletionService accountDeletionService = mock(AccountDeletionService.class);
    private final AuthController controller = new AuthController(mock(AppUserService.class), accountDeletionService);
    private final OidcUser principal = mock(OidcUser.class);
    private final OAuth2AuthenticationToken authentication =
            new OAuth2AuthenticationToken(principal, java.util.List.of(), "google");

    @BeforeEach
    void authenticate() {
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void successfulDeletionInvalidatesSessionAndClearsSecurityContext() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpSession session = (MockHttpSession) request.getSession();

        controller.deleteAccount(principal, request);

        verify(accountDeletionService).deleteAccount(principal);
        assertThat(session.isInvalid()).isTrue();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void successfulDeletionWithoutSessionClearsContextWithoutCreatingSession() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        controller.deleteAccount(principal, request);

        verify(accountDeletionService).deleteAccount(principal);
        assertThat(request.getSession(false)).isNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void failedDeletionPreservesSessionAndAuthentication() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpSession session = (MockHttpSession) request.getSession();
        doThrow(new BadRequestException("Transfer household ownership before deleting this account"))
                .when(accountDeletionService).deleteAccount(principal);

        assertThatThrownBy(() -> controller.deleteAccount(principal, request))
                .isInstanceOf(BadRequestException.class);

        assertThat(session.isInvalid()).isFalse();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isSameAs(authentication);
    }
}
