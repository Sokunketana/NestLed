package com.example.homeinventory.service;

import com.example.homeinventory.dto.AuthenticatedUserResponse;
import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.HouseholdInvitation;
import com.example.homeinventory.entity.HouseholdMembership;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.repository.AppUserRepository;
import com.example.homeinventory.repository.HouseholdInvitationRepository;
import com.example.homeinventory.repository.HouseholdMembershipRepository;
import com.example.homeinventory.repository.HouseholdRepository;
import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppUserServiceTest {
    @Mock private AppUserRepository userRepository;
    @Mock private HouseholdRepository householdRepository;
    @Mock private HouseholdMembershipRepository membershipRepository;
    @Mock private HouseholdInvitationRepository invitationRepository;

    @Test
    void everyVerifiedNewUserGetsAnOwnedPersonalHousehold() {
        AppUserService service = service();
        AtomicReference<HouseholdMembership> createdMembership = new AtomicReference<>();
        when(userRepository.findByOidcIssuerAndOidcSubject(any(), any())).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(invocation -> {
            AppUser user = invocation.getArgument(0);
            if (user.getId() == null) ReflectionTestUtils.setField(user, "id", 7L);
            return user;
        });
        when(householdRepository.save(any())).thenAnswer(invocation -> {
            Household household = invocation.getArgument(0);
            ReflectionTestUtils.setField(household, "id", 11L);
            return household;
        });
        when(membershipRepository.findByUserId(7L))
                .thenAnswer(invocation -> Optional.ofNullable(createdMembership.get()));
        when(membershipRepository.save(any())).thenAnswer(invocation -> {
            HouseholdMembership membership = invocation.getArgument(0);
            createdMembership.set(membership);
            return membership;
        });

        AppUser user = service.synchronize(oidcUser("person@example.com", true));

        assertEquals(11L, user.getHousehold().getId());
        assertEquals(HouseholdRole.OWNER, user.getHouseholdRole());
        assertEquals("Person Example's household", user.getHousehold().getName());
        assertSame(user, createdMembership.get().getUser());
        assertEquals(HouseholdRole.OWNER, createdMembership.get().getRole());
    }

    @Test
    void rejectsAnUnverifiedEmail() {
        assertThrows(OAuth2AuthenticationException.class,
                () -> service().synchronize(oidcUser("person@example.com", false)));
        verify(userRepository, never()).save(any());
    }

    @Test
    void profileExposesOnlyTheUsersSingleHouseholdAndInvitationsForOtherHouseholds() {
        AppUserService service = service();
        AppUser user = user(5L, "person@example.com");
        Household personal = household(10L, "My place");
        user.joinHousehold(personal, HouseholdRole.OWNER);
        HouseholdMembership personalMembership = new HouseholdMembership(personal, user, HouseholdRole.OWNER);
        HouseholdInvitation duplicate = invitation(30L, personal, "person@example.com");
        Household invited = household(40L, "Friends home");
        HouseholdInvitation pending = invitation(31L, invited, "PERSON@example.com");
        when(userRepository.findByOidcIssuerAndOidcSubject(any(), any())).thenReturn(Optional.of(user));
        when(membershipRepository.findByUserId(5L))
                .thenReturn(Optional.of(personalMembership));
        when(invitationRepository.findByEmailIgnoreCaseOrderByCreatedAtAsc("person@example.com"))
                .thenReturn(List.of(duplicate, pending));

        AuthenticatedUserResponse profile = service.getProfile(oidcUser("person@example.com", true));

        assertEquals(10L, profile.householdId());
        assertEquals(1, profile.pendingInvitations().size());
        assertEquals(40L, profile.pendingInvitations().getFirst().householdId());
    }

    private AppUserService service() {
        return new AppUserService(userRepository, householdRepository, membershipRepository, invitationRepository);
    }

    private AppUser user(Long id, String email) {
        AppUser user = new AppUser("https://accounts.google.com", "google-subject-123",
                email, "Person Example", null);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Household household(Long id, String name) {
        Household household = new Household(name);
        ReflectionTestUtils.setField(household, "id", id);
        return household;
    }

    private HouseholdInvitation invitation(Long id, Household household, String email) {
        HouseholdInvitation invitation = new HouseholdInvitation(household, email);
        ReflectionTestUtils.setField(invitation, "id", id);
        ReflectionTestUtils.setField(invitation, "createdAt", Instant.parse("2026-09-02T01:00:00Z"));
        return invitation;
    }

    private OidcUser oidcUser(String email, boolean verified) {
        OidcIdToken token = new OidcIdToken(
                "token", Instant.now(), Instant.now().plusSeconds(60), Map.of(
                "iss", URI.create("https://accounts.google.com").toString(),
                "sub", "google-subject-123",
                "email", email,
                "email_verified", verified,
                "name", "Person Example"));
        return new DefaultOidcUser(List.of(), token);
    }
}
