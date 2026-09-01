package com.example.homeinventory.service;

import com.example.homeinventory.dto.AuthenticatedUserResponse;
import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.HouseholdInvitation;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.ResourceNotFoundException;
import com.example.homeinventory.repository.AppUserRepository;
import com.example.homeinventory.repository.HouseholdInvitationRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {
    @Mock
    private AppUserService appUserService;
    @Mock
    private AppUserRepository userRepository;
    @Mock
    private HouseholdInvitationRepository invitationRepository;
    @Mock
    private OidcUser principal;

    @Test
    void acceptsInvitationMatchingTheLocalUsersEmail() {
        InvitationService service = service();
        AppUser invitee = invitee("Family@Example.com");
        Household household = new Household("Our home");
        HouseholdInvitation invitation = new HouseholdInvitation(household, "family@example.com");
        AuthenticatedUserResponse expected = profile(HouseholdRole.MEMBER);
        when(appUserService.getRequired(principal)).thenReturn(invitee);
        when(invitationRepository.findById(10L)).thenReturn(Optional.of(invitation));
        when(appUserService.getProfile(principal)).thenReturn(expected);

        AuthenticatedUserResponse response = service.accept(principal, 10L);

        assertSame(expected, response);
        assertSame(household, invitee.getHousehold());
        assertEquals(HouseholdRole.MEMBER, invitee.getHouseholdRole());
        verify(userRepository).save(invitee);
        verify(invitationRepository).delete(invitation);
    }

    @Test
    void rejectsInvitationMatchingTheLocalUsersEmail() {
        InvitationService service = service();
        AppUser invitee = invitee("family@example.com");
        HouseholdInvitation invitation = new HouseholdInvitation(
                new Household("Our home"), "FAMILY@example.com");
        AuthenticatedUserResponse expected = profile(null);
        when(appUserService.getRequired(principal)).thenReturn(invitee);
        when(invitationRepository.findById(10L)).thenReturn(Optional.of(invitation));
        when(appUserService.getProfile(principal)).thenReturn(expected);

        AuthenticatedUserResponse response = service.reject(principal, 10L);

        assertSame(expected, response);
        assertNull(invitee.getHousehold());
        assertNull(invitee.getHouseholdRole());
        verify(invitationRepository).delete(invitation);
        verify(userRepository, never()).save(invitee);
    }

    @Test
    void cannotActOnAnInvitationForAnotherEmail() {
        InvitationService service = service();
        AppUser invitee = invitee("family@example.com");
        HouseholdInvitation invitation = new HouseholdInvitation(
                new Household("Our home"), "someone-else@example.com");
        when(appUserService.getRequired(principal)).thenReturn(invitee);
        when(invitationRepository.findById(10L)).thenReturn(Optional.of(invitation));

        assertThrows(ResourceNotFoundException.class, () -> service.accept(principal, 10L));

        verify(invitationRepository, never()).delete(invitation);
        verify(userRepository, never()).save(invitee);
        verify(appUserService, never()).getProfile(principal);
    }

    @Test
    void cannotAcceptAnInvitationAfterAlreadyJoiningAHousehold() {
        InvitationService service = service();
        AppUser invitee = invitee("family@example.com");
        invitee.joinHousehold(new Household("Current home"), HouseholdRole.MEMBER);
        HouseholdInvitation invitation = new HouseholdInvitation(
                new Household("Another home"), "family@example.com");
        when(appUserService.getRequired(principal)).thenReturn(invitee);
        when(invitationRepository.findById(10L)).thenReturn(Optional.of(invitation));

        assertThrows(BadRequestException.class, () -> service.accept(principal, 10L));

        verify(invitationRepository, never()).delete(invitation);
        verify(userRepository, never()).save(invitee);
    }

    @Test
    void cannotActOnAnInvitationThatNoLongerExists() {
        InvitationService service = service();
        AppUser invitee = invitee("family@example.com");
        when(appUserService.getRequired(principal)).thenReturn(invitee);
        when(invitationRepository.findById(10L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.reject(principal, 10L));

        verify(userRepository, never()).save(invitee);
        verify(appUserService, never()).getProfile(principal);
    }

    private InvitationService service() {
        return new InvitationService(appUserService, userRepository, invitationRepository);
    }

    private AppUser invitee(String email) {
        return new AppUser("https://accounts.google.com", "subject", email, "Family Member", null);
    }

    private AuthenticatedUserResponse profile(HouseholdRole role) {
        boolean member = role != null;
        return new AuthenticatedUserResponse(
                1L, "family@example.com", "Family Member", null,
                member ? 2L : null, member ? "Our home" : null, role, null);
    }
}
