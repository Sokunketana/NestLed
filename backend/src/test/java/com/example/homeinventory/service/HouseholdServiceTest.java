package com.example.homeinventory.service;

import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.HouseholdMembership;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.ResourceNotFoundException;
import com.example.homeinventory.repository.AppUserRepository;
import com.example.homeinventory.repository.HouseholdInvitationRepository;
import com.example.homeinventory.repository.HouseholdMembershipRepository;
import com.example.homeinventory.repository.HouseholdRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HouseholdServiceTest {
    @Test
    void removingMemberFromCurrentHouseholdSwitchesThemToTheirOtherHousehold() {
        Fixture fixture = new Fixture();
        AppUser memberUser = fixture.user(2L, "member@example.com");
        memberUser.joinHousehold(fixture.shared, HouseholdRole.MEMBER);
        HouseholdMembership member = new HouseholdMembership(
                fixture.shared, memberUser, HouseholdRole.MEMBER);
        Household personal = fixture.household(20L, "Member's home");
        HouseholdMembership alternative = new HouseholdMembership(
                personal, memberUser, HouseholdRole.OWNER);
        when(fixture.memberships.findByHouseholdIdAndUserId(10L, 2L)).thenReturn(Optional.of(member));
        when(fixture.memberships.findByUserIdOrderByHouseholdNameAsc(2L))
                .thenReturn(List.of(member, alternative));

        fixture.service.removeMember(fixture.principal, 2L);

        verify(fixture.memberships).delete(member);
        assertSame(personal, memberUser.getHousehold());
        verify(fixture.users).save(memberUser);
    }

    @Test
    void ownerCannotRemoveAMemberFromAnotherHouseholdByGuessingTheirId() {
        Fixture fixture = new Fixture();
        when(fixture.memberships.findByHouseholdIdAndUserId(10L, 77L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> fixture.service.removeMember(fixture.principal, 77L));

        verify(fixture.memberships, never()).delete(any());
    }

    @Test
    void nonOwnerCanLeaveCurrentHouseholdAndSwitchesToTheirOtherHousehold() {
        Fixture fixture = new Fixture();
        AppUser memberUser = fixture.user(2L, "member@example.com");
        memberUser.joinHousehold(fixture.shared, HouseholdRole.MEMBER);
        HouseholdMembership member = new HouseholdMembership(
                fixture.shared, memberUser, HouseholdRole.MEMBER);
        Household personal = fixture.household(20L, "Member's home");
        HouseholdMembership alternative = new HouseholdMembership(
                personal, memberUser, HouseholdRole.OWNER);
        when(fixture.appUsers.getRequired(fixture.principal)).thenReturn(memberUser);
        when(fixture.memberships.findByUserIdAndHouseholdId(2L, 10L)).thenReturn(Optional.of(member));
        when(fixture.memberships.findByUserIdOrderByHouseholdNameAsc(2L))
                .thenReturn(List.of(member, alternative));

        fixture.service.leave(fixture.principal);

        verify(fixture.memberships).delete(member);
        assertSame(personal, memberUser.getHousehold());
        verify(fixture.users).save(memberUser);
    }

    @Test
    void ownerCannotLeaveTheirHousehold() {
        Fixture fixture = new Fixture();

        assertThrows(BadRequestException.class, () -> fixture.service.leave(fixture.principal));

        verify(fixture.memberships, never()).delete(any());
    }

    private static class Fixture {
        final AppUserService appUsers = mock(AppUserService.class);
        final AppUserRepository users = mock(AppUserRepository.class);
        final HouseholdRepository households = mock(HouseholdRepository.class);
        final HouseholdMembershipRepository memberships = mock(HouseholdMembershipRepository.class);
        final HouseholdInvitationRepository invitations = mock(HouseholdInvitationRepository.class);
        final OidcUser principal = mock(OidcUser.class);
        final Household shared = household(10L, "Shared home");
        final AppUser ownerUser = user(1L, "owner@example.com");
        final HouseholdMembership owner = new HouseholdMembership(shared, ownerUser, HouseholdRole.OWNER);
        final HouseholdService service = new HouseholdService(
                appUsers, users, households, memberships, invitations);

        Fixture() {
            ownerUser.joinHousehold(shared, HouseholdRole.OWNER);
            when(appUsers.getRequired(principal)).thenReturn(ownerUser);
            when(memberships.findByUserIdAndHouseholdId(1L, 10L)).thenReturn(Optional.of(owner));
            when(memberships.findByHouseholdIdOrderByUserDisplayNameAscUserEmailAsc(10L))
                    .thenReturn(List.of(owner));
            when(invitations.findByHouseholdIdOrderByCreatedAtAsc(10L)).thenReturn(List.of());
        }

        AppUser user(Long id, String email) {
            return HouseholdServiceTest.user(id, email);
        }

        Household household(Long id, String name) {
            return HouseholdServiceTest.household(id, name);
        }
    }

    private static AppUser user(Long id, String email) {
        AppUser user = new AppUser("issuer", "subject-" + id, email, email, null);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static Household household(Long id, String name) {
        Household household = new Household(name);
        ReflectionTestUtils.setField(household, "id", id);
        return household;
    }
}
