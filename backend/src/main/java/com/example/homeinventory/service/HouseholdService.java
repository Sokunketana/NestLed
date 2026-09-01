package com.example.homeinventory.service;

import com.example.homeinventory.dto.HouseholdInvitationResponse;
import com.example.homeinventory.dto.HouseholdMemberResponse;
import com.example.homeinventory.dto.HouseholdResponse;
import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.HouseholdInvitation;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.ResourceNotFoundException;
import com.example.homeinventory.repository.AppUserRepository;
import com.example.homeinventory.repository.HouseholdInvitationRepository;
import com.example.homeinventory.repository.HouseholdRepository;
import java.util.Locale;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class HouseholdService {
    private final AppUserService appUserService;
    private final AppUserRepository userRepository;
    private final HouseholdRepository householdRepository;
    private final HouseholdInvitationRepository invitationRepository;

    public HouseholdService(AppUserService appUserService, AppUserRepository userRepository,
                            HouseholdRepository householdRepository,
                            HouseholdInvitationRepository invitationRepository) {
        this.appUserService = appUserService;
        this.userRepository = userRepository;
        this.householdRepository = householdRepository;
        this.invitationRepository = invitationRepository;
    }

    public HouseholdResponse get(OidcUser principal) {
        return toResponse(requiredMember(principal));
    }

    @Transactional
    public HouseholdResponse rename(OidcUser principal, String name) {
        AppUser owner = requiredOwner(principal);
        owner.getHousehold().setName(name.trim());
        householdRepository.save(owner.getHousehold());
        return toResponse(owner);
    }

    @Transactional
    public HouseholdResponse invite(OidcUser principal, String rawEmail) {
        AppUser owner = requiredOwner(principal);
        Household household = owner.getHousehold();
        String email = rawEmail.trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByHouseholdIdAndEmailIgnoreCase(household.getId(), email)) {
            throw new BadRequestException("That person is already a household member");
        }
        if (invitationRepository.existsByHouseholdIdAndEmailIgnoreCase(household.getId(), email)) {
            throw new BadRequestException("That email address has already been invited");
        }
        invitationRepository.save(new HouseholdInvitation(household, email));
        return toResponse(owner);
    }

    @Transactional
    public HouseholdResponse cancelInvitation(OidcUser principal, Long invitationId) {
        AppUser owner = requiredOwner(principal);
        HouseholdInvitation invitation = invitationRepository.findById(invitationId)
                .filter(value -> value.getHousehold().getId().equals(owner.getHousehold().getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Household invitation was not found"));
        invitationRepository.delete(invitation);
        return toResponse(owner);
    }

    @Transactional
    public HouseholdResponse removeMember(OidcUser principal, Long memberId) {
        AppUser owner = requiredOwner(principal);
        if (owner.getId().equals(memberId)) {
            throw new BadRequestException("The household owner cannot remove themselves");
        }
        AppUser member = userRepository.findById(memberId)
                .filter(value -> value.getHousehold() != null
                        && value.getHousehold().getId().equals(owner.getHousehold().getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Household member was not found"));
        member.leaveHousehold();
        userRepository.save(member);
        return toResponse(owner);
    }

    private AppUser requiredMember(OidcUser principal) {
        AppUser user = appUserService.getRequired(principal);
        if (user.getHousehold() == null || user.getHouseholdRole() == null) {
            throw new AccessDeniedException("This account is not a household member");
        }
        return user;
    }

    private AppUser requiredOwner(OidcUser principal) {
        AppUser user = requiredMember(principal);
        if (user.getHouseholdRole() != HouseholdRole.OWNER) {
            throw new AccessDeniedException("Only the household owner can manage members");
        }
        return user;
    }

    private HouseholdResponse toResponse(AppUser currentUser) {
        Household household = currentUser.getHousehold();
        var members = userRepository.findByHouseholdIdOrderByDisplayNameAscEmailAsc(household.getId()).stream()
                .map(user -> new HouseholdMemberResponse(user.getId(), user.getEmail(), user.getDisplayName(),
                        user.getPictureUrl(), user.getHouseholdRole()))
                .toList();
        var invitations = invitationRepository
                .findByHouseholdIdOrderByCreatedAtAsc(household.getId()).stream()
                .map(invitation -> new HouseholdInvitationResponse(
                        invitation.getId(), invitation.getEmail(), invitation.getCreatedAt()))
                .toList();
        return new HouseholdResponse(household.getId(), household.getName(), currentUser.getHouseholdRole(),
                members, invitations);
    }
}
