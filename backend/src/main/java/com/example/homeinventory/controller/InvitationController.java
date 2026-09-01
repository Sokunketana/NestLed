package com.example.homeinventory.controller;

import com.example.homeinventory.dto.AuthenticatedUserResponse;
import com.example.homeinventory.service.InvitationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {
    private final InvitationService service;

    public InvitationController(InvitationService service) {
        this.service = service;
    }

    @PostMapping("/{id}/accept")
    public AuthenticatedUserResponse accept(@AuthenticationPrincipal OidcUser user, @PathVariable Long id) {
        return service.accept(user, id);
    }

    @DeleteMapping("/{id}")
    public AuthenticatedUserResponse reject(@AuthenticationPrincipal OidcUser user, @PathVariable Long id) {
        return service.reject(user, id);
    }
}
