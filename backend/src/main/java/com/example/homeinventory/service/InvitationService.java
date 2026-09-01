package com.example.homeinventory.service;

import com.example.homeinventory.dto.AuthenticatedUserResponse;
import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.entity.HouseholdInvitation;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.ResourceNotFoundException;
import com.example.homeinventory.repository.AppUserRepository;
import com.example.homeinventory.repository.HouseholdInvitationRepository;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvitationService {
    private final AppUserService appUserService;
    private final AppUserRepository userRepository;
    private final HouseholdInvitationRepository invitationRepository;

    public InvitationService(AppUserService appUserService, AppUserRepository userRepository,
                             HouseholdInvitationRepository invitationRepository) {
        this.appUserService = appUserService;
        this.userRepository = userRepository;
        this.invitationRepository = invitationRepository;
    }

    @Transactional
    public AuthenticatedUserResponse accept(OidcUser principal, Long invitationId) {
        AppUser invitee = appUserService.getRequired(principal);
        HouseholdInvitation invitation = requiredInvitation(invitee, invitationId);
        if (invitee.getHousehold() != null || invitee.getHouseholdRole() != null) {
            throw new BadRequestException("This account already belongs to a household");
        }

        invitee.joinHousehold(invitation.getHousehold(), HouseholdRole.MEMBER);
        userRepository.save(invitee);
        invitationRepository.delete(invitation);
        return appUserService.getProfile(principal);
    }

    @Transactional
    public AuthenticatedUserResponse reject(OidcUser principal, Long invitationId) {
        AppUser invitee = appUserService.getRequired(principal);
        HouseholdInvitation invitation = requiredInvitation(invitee, invitationId);
        invitationRepository.delete(invitation);
        return appUserService.getProfile(principal);
    }

    private HouseholdInvitation requiredInvitation(AppUser invitee, Long invitationId) {
        return invitationRepository.findById(invitationId)
                .filter(invitation -> invitation.getEmail().equalsIgnoreCase(invitee.getEmail()))
                .orElseThrow(() -> new ResourceNotFoundException("Household invitation was not found"));
    }
}
