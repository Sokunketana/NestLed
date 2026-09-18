package com.example.homeinventory.service;

import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.HouseholdMembership;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.repository.HouseholdMembershipRepository;
import com.example.homeinventory.repository.ItemRepository;
import java.util.Objects;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountDeletionService {
    private final AppUserService appUserService;
    private final HouseholdMembershipRepository membershipRepository;
    private final ItemRepository itemRepository;
    private final PhotoStorageService photoStorageService;
    private final JdbcTemplate jdbcTemplate;

    public AccountDeletionService(AppUserService appUserService,
                                  HouseholdMembershipRepository membershipRepository,
                                  ItemRepository itemRepository,
                                  PhotoStorageService photoStorageService,
                                  JdbcTemplate jdbcTemplate) {
        this.appUserService = appUserService;
        this.membershipRepository = membershipRepository;
        this.itemRepository = itemRepository;
        this.photoStorageService = photoStorageService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void deleteAccount(OidcUser principal) {
        AppUser appUser = appUserService.getRequired(principal);
        HouseholdMembership membership = membershipRepository.findByUserId(appUser.getId()).orElse(null);

        if (membership == null) {
            deleteUser(appUser);
            return;
        }

        Household household = membership.getHousehold();
        Long householdId = household.getId();
        long memberCount = membershipRepository.countByHouseholdId(householdId);
        if (membership.getRole() == HouseholdRole.OWNER && memberCount > 1) {
            throw new BadRequestException("Transfer household ownership before deleting this account");
        }

        deleteInvitationsForEmail(appUser.getEmail());
        if (memberCount == 1) {
            deleteHouseholdData(householdId);
            jdbcTemplate.update("DELETE FROM household_memberships WHERE id = ?", membership.getId());
            deleteUser(appUser);
            jdbcTemplate.update("DELETE FROM households WHERE id = ?", householdId);
            return;
        }

        jdbcTemplate.update("DELETE FROM household_memberships WHERE id = ?", membership.getId());
        deleteUser(appUser);
    }

    private void deleteHouseholdData(Long householdId) {
        for (Item item : itemRepository.findByHouseholdIdOrderByNameAsc(householdId)) {
            if (item.getPhotoFilename() != null) {
                photoStorageService.delete(item.getPhotoFilename());
            }
        }
        jdbcTemplate.update("DELETE FROM item_movements WHERE household_id = ?", householdId);
        jdbcTemplate.update("DELETE FROM items WHERE household_id = ?", householdId);
        jdbcTemplate.update("DELETE FROM storage_locations WHERE household_id = ?", householdId);
        jdbcTemplate.update("DELETE FROM rooms WHERE household_id = ?", householdId);
        jdbcTemplate.update("DELETE FROM categories WHERE household_id = ?", householdId);
        jdbcTemplate.update("DELETE FROM household_invitations WHERE household_id = ?", householdId);
    }

    private void deleteInvitationsForEmail(String email) {
        jdbcTemplate.update("DELETE FROM household_invitations WHERE lower(email) = lower(?)", email);
    }

    private void deleteUser(AppUser appUser) {
        jdbcTemplate.update("DELETE FROM app_users WHERE id = ?", Objects.requireNonNull(appUser.getId()));
    }
}
