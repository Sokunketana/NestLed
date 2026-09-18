package com.example.homeinventory.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.HouseholdMembership;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.repository.HouseholdMembershipRepository;
import com.example.homeinventory.repository.ItemRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.test.util.ReflectionTestUtils;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AccountDeletionServiceTest {
    @Mock private AppUserService appUserService;
    @Mock private HouseholdMembershipRepository membershipRepository;
    @Mock private ItemRepository itemRepository;
    @Mock private PhotoStorageService photoStorageService;
    @Mock private JdbcTemplate jdbcTemplate;
    @Mock private OidcUser principal;

    @Test
    void deletesSoloHouseholdAndAccountData() {
        Household household = household(10L);
        AppUser user = user(1L, "owner@example.com");
        HouseholdMembership membership = membership(20L, household, user, HouseholdRole.OWNER);
        Item item = new Item();
        item.setPhotoFilename("photo.jpg");
        when(appUserService.getRequired(principal)).thenReturn(user);
        when(membershipRepository.findByUserId(1L)).thenReturn(Optional.of(membership));
        when(membershipRepository.countByHouseholdId(10L)).thenReturn(1L);
        when(itemRepository.findByHouseholdIdOrderByNameAsc(10L)).thenReturn(List.of(item));

        service().deleteAccount(principal);

        verify(photoStorageService).delete("photo.jpg");
        verify(jdbcTemplate).update("DELETE FROM item_movements WHERE household_id = ?", 10L);
        verify(jdbcTemplate).update("DELETE FROM items WHERE household_id = ?", 10L);
        verify(jdbcTemplate).update("DELETE FROM household_memberships WHERE id = ?", 20L);
        verify(jdbcTemplate).update("DELETE FROM app_users WHERE id = ?", 1L);
        verify(jdbcTemplate).update("DELETE FROM households WHERE id = ?", 10L);
    }

    @Test
    void doesNotDeleteSharedHouseholdWhenMemberDeletesAccount() {
        Household household = household(10L);
        AppUser user = user(1L, "member@example.com");
        HouseholdMembership membership = membership(20L, household, user, HouseholdRole.MEMBER);
        when(appUserService.getRequired(principal)).thenReturn(user);
        when(membershipRepository.findByUserId(1L)).thenReturn(Optional.of(membership));
        when(membershipRepository.countByHouseholdId(10L)).thenReturn(2L);

        service().deleteAccount(principal);

        verify(jdbcTemplate).update("DELETE FROM household_memberships WHERE id = ?", 20L);
        verify(jdbcTemplate).update("DELETE FROM app_users WHERE id = ?", 1L);
        verify(jdbcTemplate, never()).update("DELETE FROM households WHERE id = ?", 10L);
        verifyNoInteractions(itemRepository, photoStorageService);
    }

    @Test
    void preventsOwnerFromDeletingAHouseholdWithOtherMembers() {
        Household household = household(10L);
        AppUser user = user(1L, "owner@example.com");
        HouseholdMembership membership = membership(20L, household, user, HouseholdRole.OWNER);
        when(appUserService.getRequired(principal)).thenReturn(user);
        when(membershipRepository.findByUserId(1L)).thenReturn(Optional.of(membership));
        when(membershipRepository.countByHouseholdId(10L)).thenReturn(2L);

        assertThrows(BadRequestException.class, () -> service().deleteAccount(principal));

        verifyNoInteractions(jdbcTemplate, itemRepository, photoStorageService);
    }

    private AccountDeletionService service() {
        return new AccountDeletionService(
                appUserService, membershipRepository, itemRepository, photoStorageService, jdbcTemplate);
    }

    private AppUser user(Long id, String email) {
        AppUser user = new AppUser("issuer", "subject-" + id, email, email, null);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Household household(Long id) {
        Household household = new Household("Home");
        ReflectionTestUtils.setField(household, "id", id);
        return household;
    }

    private HouseholdMembership membership(Long id, Household household, AppUser user, HouseholdRole role) {
        HouseholdMembership membership = new HouseholdMembership(household, user, role);
        ReflectionTestUtils.setField(membership, "id", id);
        return membership;
    }
}
