package com.example.homeinventory.controller;

import com.example.homeinventory.dto.AuthenticatedUserResponse;
import com.example.homeinventory.dto.CsrfTokenResponse;
import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.service.AppUserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AppUserService appUserService;

    public AuthController(AppUserService appUserService) {
        this.appUserService = appUserService;
    }

    @GetMapping("/me")
    AuthenticatedUserResponse me(@AuthenticationPrincipal OidcUser oidcUser) {
        AppUser appUser = appUserService.getRequired(oidcUser);
        return new AuthenticatedUserResponse(
                appUser.getId(),
                appUser.getEmail(),
                appUser.getDisplayName(),
                appUser.getPictureUrl());
    }

    @GetMapping("/csrf")
    CsrfTokenResponse csrf(CsrfToken csrfToken) {
        return new CsrfTokenResponse(
                csrfToken.getHeaderName(),
                csrfToken.getParameterName(),
                csrfToken.getToken());
    }
}
