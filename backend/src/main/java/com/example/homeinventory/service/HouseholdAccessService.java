package com.example.homeinventory.service;

import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.HouseholdMembership;
import com.example.homeinventory.repository.HouseholdMembershipRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class HouseholdAccessService {
    private final AppUserService appUserService;
    private final HouseholdMembershipRepository membershipRepository;

    public HouseholdAccessService(AppUserService appUserService,
                                  HouseholdMembershipRepository membershipRepository) {
        this.appUserService = appUserService;
        this.membershipRepository = membershipRepository;
    }

    public Household getActiveHousehold() {
        return getActiveMembership(currentOidcUser()).getHousehold();
    }

    public HouseholdMembership getActiveMembership(OidcUser principal) {
        AppUser user = appUserService.getRequired(principal);
        if (user.getHousehold() == null) {
            throw new AccessDeniedException("Select a household before accessing inventory");
        }
        return membershipRepository.findByUserIdAndHouseholdId(user.getId(), user.getHousehold().getId())
                .orElseThrow(() -> new AccessDeniedException("This account cannot access the selected household"));
    }

    private OidcUser currentOidcUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof OidcUser oidcUser)) {
            throw new AccessDeniedException("A signed-in account is required");
        }
        return oidcUser;
    }
}
