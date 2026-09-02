package com.example.homeinventory.service;

import com.example.homeinventory.dto.HouseholdInvitationResponse;
import com.example.homeinventory.dto.HouseholdMemberResponse;
import com.example.homeinventory.dto.HouseholdResponse;
import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.HouseholdInvitation;
import com.example.homeinventory.entity.HouseholdMembership;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.ResourceNotFoundException;
import com.example.homeinventory.repository.AppUserRepository;
import com.example.homeinventory.repository.HouseholdInvitationRepository;
import com.example.homeinventory.repository.HouseholdMembershipRepository;
import com.example.homeinventory.repository.HouseholdRepository;
import java.util.List;
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
    private final HouseholdMembershipRepository membershipRepository;
    private final HouseholdInvitationRepository invitationRepository;

    public HouseholdService(AppUserService appUserService, AppUserRepository userRepository,
                            HouseholdRepository householdRepository,
                            HouseholdMembershipRepository membershipRepository,
                            HouseholdInvitationRepository invitationRepository) {
        this.appUserService = appUserService;
        this.userRepository = userRepository;
        this.householdRepository = householdRepository;
        this.membershipRepository = membershipRepository;
        this.invitationRepository = invitationRepository;
    }

    public HouseholdResponse get(OidcUser principal) {
        return toResponse(requiredMember(principal));
    }

    @Transactional
    public HouseholdResponse rename(OidcUser principal, String name) {
        HouseholdMembership owner = requiredOwner(principal);
        owner.getHousehold().setName(name.trim());
        householdRepository.save(owner.getHousehold());
        return toResponse(owner);
    }

    @Transactional
    public HouseholdResponse invite(OidcUser principal, String rawEmail) {
        HouseholdMembership owner = requiredOwner(principal);
        Household household = owner.getHousehold();
        String email = rawEmail.trim().toLowerCase(Locale.ROOT);
        if (membershipRepository.existsByHouseholdIdAndUserEmailIgnoreCase(household.getId(), email)) {
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
        HouseholdMembership owner = requiredOwner(principal);
        HouseholdInvitation invitation = invitationRepository.findById(invitationId)
                .filter(value -> value.getHousehold().getId().equals(owner.getHousehold().getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Household invitation was not found"));
        invitationRepository.delete(invitation);
        return toResponse(owner);
    }

    @Transactional
    public HouseholdResponse removeMember(OidcUser principal, Long memberId) {
        HouseholdMembership owner = requiredOwner(principal);
        HouseholdMembership member = membershipRepository
                .findByHouseholdIdAndUserId(owner.getHousehold().getId(), memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Household member was not found"));
        if (member.getRole() == HouseholdRole.OWNER) {
            throw new BadRequestException("A household owner cannot be removed");
        }

        AppUser removedUser = member.getUser();
        membershipRepository.delete(member);
        if (removedUser.getHousehold() != null
                && removedUser.getHousehold().getId().equals(owner.getHousehold().getId())) {
            removedUser.leaveHousehold();
            userRepository.save(removedUser);
        }
        return toResponse(owner);
    }

    @Transactional
    public void leave(OidcUser principal) {
        AppUser user = appUserService.getRequired(principal);
        HouseholdMembership membership = requiredMember(user);
        if (membership.getRole() == HouseholdRole.OWNER) {
            throw new BadRequestException("A household owner cannot leave the household");
        }

        membershipRepository.delete(membership);
        user.leaveHousehold();
        userRepository.save(user);
    }

    private HouseholdMembership requiredMember(OidcUser principal) {
        AppUser user = appUserService.getRequired(principal);
        return requiredMember(user);
    }

    private HouseholdMembership requiredMember(AppUser user) {
        if (user.getHousehold() == null) {
            throw new AccessDeniedException("Join a household first");
        }
        return membershipRepository.findByUserIdAndHouseholdId(user.getId(), user.getHousehold().getId())
                .orElseThrow(() -> new AccessDeniedException("This account cannot access the current household"));
    }

    private HouseholdMembership requiredOwner(OidcUser principal) {
        HouseholdMembership membership = requiredMember(principal);
        if (membership.getRole() != HouseholdRole.OWNER) {
            throw new AccessDeniedException("Only the household owner can manage members");
        }
        return membership;
    }

    private HouseholdResponse toResponse(HouseholdMembership currentMembership) {
        Household household = currentMembership.getHousehold();
        var members = membershipRepository
                .findByHouseholdIdOrderByUserDisplayNameAscUserEmailAsc(household.getId()).stream()
                .map(membership -> new HouseholdMemberResponse(
                        membership.getUser().getId(), membership.getUser().getEmail(),
                        membership.getUser().getDisplayName(), membership.getUser().getPictureUrl(),
                        membership.getRole()))
                .toList();
        var invitations = invitationRepository
                .findByHouseholdIdOrderByCreatedAtAsc(household.getId()).stream()
                .map(invitation -> new HouseholdInvitationResponse(
                        invitation.getId(), invitation.getEmail(), invitation.getCreatedAt()))
                .toList();
        return new HouseholdResponse(household.getId(), household.getName(), currentMembership.getRole(),
                members, invitations);
    }
}
