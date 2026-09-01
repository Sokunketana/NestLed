package com.example.homeinventory.controller;

import com.example.homeinventory.dto.HouseholdResponse;
import com.example.homeinventory.dto.InviteHouseholdMemberRequest;
import com.example.homeinventory.dto.UpdateHouseholdRequest;
import com.example.homeinventory.service.HouseholdService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/household")
public class HouseholdController {
    private final HouseholdService service;

    public HouseholdController(HouseholdService service) {
        this.service = service;
    }

    @GetMapping
    public HouseholdResponse get(@AuthenticationPrincipal OidcUser user) {
        return service.get(user);
    }

    @PutMapping
    public HouseholdResponse rename(@AuthenticationPrincipal OidcUser user,
                                    @Valid @RequestBody UpdateHouseholdRequest request) {
        return service.rename(user, request.name());
    }

    @PostMapping("/invitations")
    public HouseholdResponse invite(@AuthenticationPrincipal OidcUser user,
                                    @Valid @RequestBody InviteHouseholdMemberRequest request) {
        return service.invite(user, request.email());
    }

    @DeleteMapping("/invitations/{id}")
    public HouseholdResponse cancelInvitation(@AuthenticationPrincipal OidcUser user, @PathVariable Long id) {
        return service.cancelInvitation(user, id);
    }

    @DeleteMapping("/members/{id}")
    public HouseholdResponse removeMember(@AuthenticationPrincipal OidcUser user, @PathVariable Long id) {
        return service.removeMember(user, id);
    }
}
