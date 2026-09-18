package com.example.homeinventory.controller;

import com.example.homeinventory.dto.AuthenticatedUserResponse;
import com.example.homeinventory.dto.CsrfTokenResponse;
import com.example.homeinventory.service.AccountDeletionService;
import com.example.homeinventory.service.AppUserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AppUserService appUserService;
    private final AccountDeletionService accountDeletionService;

    public AuthController(AppUserService appUserService, AccountDeletionService accountDeletionService) {
        this.appUserService = appUserService;
        this.accountDeletionService = accountDeletionService;
    }

    @GetMapping("/me")
    AuthenticatedUserResponse me(@AuthenticationPrincipal OidcUser oidcUser) {
        return appUserService.getProfile(oidcUser);
    }

    @DeleteMapping("/account")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteAccount(@AuthenticationPrincipal OidcUser oidcUser) {
        accountDeletionService.deleteAccount(oidcUser);
    }

    @PostMapping("/onboarding/complete")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void completeOnboarding(@AuthenticationPrincipal OidcUser oidcUser) {
        appUserService.completeOnboarding(oidcUser);
    }

    @GetMapping("/csrf")
    CsrfTokenResponse csrf(CsrfToken csrfToken) {
        return new CsrfTokenResponse(
                csrfToken.getHeaderName(),
                csrfToken.getParameterName(),
                csrfToken.getToken());
    }
}
