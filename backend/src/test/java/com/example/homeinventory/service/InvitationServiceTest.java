package com.example.homeinventory.service;

import com.example.homeinventory.dto.AuthenticatedUserResponse;
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
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {
    @Mock private AppUserService appUserService;
    @Mock private AppUserRepository userRepository;
    @Mock private HouseholdMembershipRepository membershipRepository;
    @Mock private HouseholdInvitationRepository invitationRepository;
    @Mock private OidcUser principal;

    @Test
    void acceptingAnInvitationCreatesTheUsersOnlyMembership() {
        InvitationService service = service();
        AppUser invitee = invitee("Family@Example.com");
        Household household = household(20L);
        HouseholdInvitation invitation = new HouseholdInvitation(household, "family@example.com");
        AuthenticatedUserResponse expected = profile(20L, HouseholdRole.MEMBER);
        when(appUserService.getRequired(principal)).thenReturn(invitee);
        when(invitationRepository.findById(10L)).thenReturn(Optional.of(invitation));
        when(membershipRepository.findByUserId(5L)).thenReturn(Optional.empty());
        when(appUserService.getProfile(principal)).thenReturn(expected);

        AuthenticatedUserResponse response = service.accept(principal, 10L);

        assertSame(expected, response);
        assertSame(household, invitee.getHousehold());
        assertEquals(HouseholdRole.MEMBER, invitee.getHouseholdRole());
        ArgumentCaptor<HouseholdMembership> membership = ArgumentCaptor.forClass(HouseholdMembership.class);
        verify(membershipRepository).save(membership.capture());
        assertSame(invitee, membership.getValue().getUser());
        assertSame(household, membership.getValue().getHousehold());
        verify(invitationRepository).delete(invitation);
    }

    @Test
    void acceptingAnInvitationReplacesTheExistingMembership() {
        InvitationService service = service();
        AppUser invitee = invitee("family@example.com");
        Household personal = household(30L);
        Household invitedHousehold = household(20L);
        invitee.joinHousehold(personal, HouseholdRole.OWNER);
        HouseholdMembership existingMembership = new HouseholdMembership(
                personal, invitee, HouseholdRole.OWNER);
        HouseholdInvitation invitation = new HouseholdInvitation(invitedHousehold, "family@example.com");
        AuthenticatedUserResponse expected = profile(20L, HouseholdRole.MEMBER);
        when(appUserService.getRequired(principal)).thenReturn(invitee);
        when(invitationRepository.findById(10L)).thenReturn(Optional.of(invitation));
        when(membershipRepository.findByUserId(5L)).thenReturn(Optional.of(existingMembership));
        when(appUserService.getProfile(principal)).thenReturn(expected);

        AuthenticatedUserResponse response = service.accept(principal, 10L);

        assertSame(expected, response);
        assertSame(invitedHousehold, invitee.getHousehold());
        assertSame(invitedHousehold, existingMembership.getHousehold());
        assertEquals(HouseholdRole.MEMBER, existingMembership.getRole());
        verify(membershipRepository).save(existingMembership);
        verify(invitationRepository).delete(invitation);
    }

    @Test
    void rejectingKeepsTheUsersCurrentHousehold() {
        InvitationService service = service();
        AppUser invitee = invitee("family@example.com");
        Household personal = household(30L);
        invitee.joinHousehold(personal, HouseholdRole.OWNER);
        HouseholdInvitation invitation = new HouseholdInvitation(household(20L), "FAMILY@example.com");
        AuthenticatedUserResponse expected = profile(30L, HouseholdRole.OWNER);
        when(appUserService.getRequired(principal)).thenReturn(invitee);
        when(invitationRepository.findById(10L)).thenReturn(Optional.of(invitation));
        when(appUserService.getProfile(principal)).thenReturn(expected);

        AuthenticatedUserResponse response = service.reject(principal, 10L);

        assertSame(expected, response);
        assertSame(personal, invitee.getHousehold());
        verify(invitationRepository).delete(invitation);
        verify(membershipRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void cannotAcceptAHouseholdAlreadyJoined() {
        InvitationService service = service();
        AppUser invitee = invitee("family@example.com");
        Household household = household(20L);
        HouseholdInvitation invitation = new HouseholdInvitation(household, "family@example.com");
        when(appUserService.getRequired(principal)).thenReturn(invitee);
        when(invitationRepository.findById(10L)).thenReturn(Optional.of(invitation));
        when(membershipRepository.findByUserId(5L))
                .thenReturn(Optional.of(new HouseholdMembership(household, invitee, HouseholdRole.MEMBER)));

        assertThrows(BadRequestException.class, () -> service.accept(principal, 10L));

        verify(invitationRepository, never()).delete(invitation);
    }

    @Test
    void cannotActOnAnInvitationForAnotherEmail() {
        InvitationService service = service();
        AppUser invitee = invitee("family@example.com");
        HouseholdInvitation invitation = new HouseholdInvitation(household(20L), "other@example.com");
        when(appUserService.getRequired(principal)).thenReturn(invitee);
        when(invitationRepository.findById(10L)).thenReturn(Optional.of(invitation));

        assertThrows(ResourceNotFoundException.class, () -> service.accept(principal, 10L));
        verify(membershipRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void cannotActOnAnInvitationThatNoLongerExists() {
        when(appUserService.getRequired(principal)).thenReturn(invitee("family@example.com"));
        when(invitationRepository.findById(10L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service().reject(principal, 10L));
        verify(appUserService, never()).getProfile(principal);
    }

    private InvitationService service() {
        return new InvitationService(
                appUserService, userRepository, membershipRepository, invitationRepository);
    }

    private AppUser invitee(String email) {
        AppUser user = new AppUser("https://accounts.google.com", "subject", email, "Family Member", null);
        ReflectionTestUtils.setField(user, "id", 5L);
        return user;
    }

    private Household household(Long id) {
        Household household = new Household("Our home");
        ReflectionTestUtils.setField(household, "id", id);
        return household;
    }

    private AuthenticatedUserResponse profile(Long householdId, HouseholdRole role) {
        return new AuthenticatedUserResponse(
                5L, "family@example.com", "Family Member", null,
                householdId, "Our home", role, List.of());
    }
}
