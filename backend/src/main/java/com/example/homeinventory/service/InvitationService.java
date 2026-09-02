package com.example.homeinventory.service;

import com.example.homeinventory.dto.AuthenticatedUserResponse;
import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.entity.HouseholdInvitation;
import com.example.homeinventory.entity.HouseholdMembership;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.ResourceNotFoundException;
import com.example.homeinventory.repository.AppUserRepository;
import com.example.homeinventory.repository.HouseholdInvitationRepository;
import com.example.homeinventory.repository.HouseholdMembershipRepository;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvitationService {
    private final AppUserService appUserService;
    private final AppUserRepository userRepository;
    private final HouseholdMembershipRepository membershipRepository;
    private final HouseholdInvitationRepository invitationRepository;

    public InvitationService(AppUserService appUserService, AppUserRepository userRepository,
                             HouseholdMembershipRepository membershipRepository,
                             HouseholdInvitationRepository invitationRepository) {
        this.appUserService = appUserService;
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.invitationRepository = invitationRepository;
    }

    @Transactional
    public AuthenticatedUserResponse accept(OidcUser principal, Long invitationId) {
        AppUser invitee = appUserService.getRequired(principal);
        HouseholdInvitation invitation = requiredInvitation(invitee, invitationId);
        HouseholdMembership membership = membershipRepository.findByUserId(invitee.getId()).orElse(null);
        if (membership != null && membership.getHousehold().getId().equals(invitation.getHousehold().getId())) {
            throw new BadRequestException("This account already belongs to that household");
        }

        if (membership == null) {
            membership = new HouseholdMembership(invitation.getHousehold(), invitee, HouseholdRole.MEMBER);
        } else {
            // A user has one membership row. Accepting another invitation transfers
            // that row instead of creating a second membership.
            membership.moveTo(invitation.getHousehold(), HouseholdRole.MEMBER);
        }
        membershipRepository.save(membership);
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
