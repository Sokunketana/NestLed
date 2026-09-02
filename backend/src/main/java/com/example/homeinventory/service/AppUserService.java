package com.example.homeinventory.service;

import com.example.homeinventory.dto.AuthenticatedUserResponse;
import com.example.homeinventory.dto.PendingHouseholdInvitationResponse;
import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.HouseholdMembership;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.repository.AppUserRepository;
import com.example.homeinventory.repository.HouseholdInvitationRepository;
import com.example.homeinventory.repository.HouseholdMembershipRepository;
import com.example.homeinventory.repository.HouseholdRepository;
import java.net.URL;
import java.util.List;
import java.util.Locale;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AppUserService {
    private static final String ACCESS_DENIED = "access_denied";

    private final AppUserRepository userRepository;
    private final HouseholdRepository householdRepository;
    private final HouseholdMembershipRepository membershipRepository;
    private final HouseholdInvitationRepository invitationRepository;

    public AppUserService(AppUserRepository userRepository, HouseholdRepository householdRepository,
                          HouseholdMembershipRepository membershipRepository,
                          HouseholdInvitationRepository invitationRepository) {
        this.userRepository = userRepository;
        this.householdRepository = householdRepository;
        this.membershipRepository = membershipRepository;
        this.invitationRepository = invitationRepository;
    }

    @Transactional
    public AppUser synchronize(OidcUser oidcUser) {
        String email = normalizeEmail(oidcUser.getEmail());
        if (!Boolean.TRUE.equals(oidcUser.getEmailVerified())) {
            throw denied("The identity provider has not verified this email address");
        }
        String issuer = requireIssuer(oidcUser.getIssuer());
        String subject = requireClaim(oidcUser.getSubject(), "The identity provider did not supply a subject");

        AppUser appUser = userRepository.findByOidcIssuerAndOidcSubject(issuer, subject)
                .orElseGet(() -> new AppUser(issuer, subject, email,
                        normalizeOptional(oidcUser.getFullName()), normalizeOptional(oidcUser.getPicture())));
        appUser.updateProfile(email, normalizeOptional(oidcUser.getFullName()), normalizeOptional(oidcUser.getPicture()));
        appUser = userRepository.save(appUser);
        ensureMembership(appUser);
        return userRepository.save(appUser);
    }

    @Transactional(readOnly = true)
    public AppUser getRequired(OidcUser oidcUser) {
        String issuer = requireIssuer(oidcUser.getIssuer());
        String subject = requireClaim(oidcUser.getSubject(), "The identity provider did not supply a subject");
        return userRepository.findByOidcIssuerAndOidcSubject(issuer, subject)
                .orElseThrow(() -> denied("The signed-in account is not registered"));
    }

    @Transactional
    public AuthenticatedUserResponse getProfile(OidcUser oidcUser) {
        AppUser appUser = getRequired(oidcUser);
        HouseholdMembership membership = ensureMembership(appUser);
        return toResponse(appUser, membership);
    }

    private HouseholdMembership ensureMembership(AppUser appUser) {
        HouseholdMembership membership = membershipRepository.findByUserId(appUser.getId()).orElse(null);
        if (membership == null && appUser.getHousehold() != null) {
            HouseholdRole legacyRole = appUser.getHouseholdRole() == null
                    ? HouseholdRole.MEMBER : appUser.getHouseholdRole();
            membership = membershipRepository.save(
                    new HouseholdMembership(appUser.getHousehold(), appUser, legacyRole));
        }

        if (membership == null) {
            Household personalHousehold = householdRepository.save(new Household(defaultHouseholdName(appUser)));
            membership = membershipRepository.save(
                    new HouseholdMembership(personalHousehold, appUser, HouseholdRole.OWNER));
        }

        if (appUser.getHousehold() == null
                || !appUser.getHousehold().getId().equals(membership.getHousehold().getId())
                || appUser.getHouseholdRole() != membership.getRole()) {
            appUser.joinHousehold(membership.getHousehold(), membership.getRole());
            userRepository.save(appUser);
        }
        return membership;
    }

    private AuthenticatedUserResponse toResponse(AppUser appUser, HouseholdMembership membership) {
        List<PendingHouseholdInvitationResponse> invitations = invitationRepository
                .findByEmailIgnoreCaseOrderByCreatedAtAsc(appUser.getEmail()).stream()
                .filter(invitation -> !invitation.getHousehold().getId().equals(membership.getHousehold().getId()))
                .map(invitation -> new PendingHouseholdInvitationResponse(
                        invitation.getId(), invitation.getHousehold().getId(),
                        invitation.getHousehold().getName(), invitation.getCreatedAt()))
                .toList();
        return new AuthenticatedUserResponse(
                appUser.getId(), appUser.getEmail(), appUser.getDisplayName(), appUser.getPictureUrl(),
                membership.getHousehold().getId(), membership.getHousehold().getName(), membership.getRole(),
                invitations);
    }

    private String defaultHouseholdName(AppUser appUser) {
        return StringUtils.hasText(appUser.getDisplayName())
                ? appUser.getDisplayName().trim() + "'s household"
                : "My household";
    }

    private String normalizeEmail(String email) {
        return requireClaim(email, "The identity provider did not supply an email address")
                .toLowerCase(Locale.ROOT);
    }

    private String requireIssuer(URL issuer) {
        if (issuer == null) {
            throw denied("The identity provider did not supply an issuer");
        }
        return issuer.toString();
    }

    private String requireClaim(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw denied(message);
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private OAuth2AuthenticationException denied(String message) {
        return new OAuth2AuthenticationException(new OAuth2Error(ACCESS_DENIED), message);
    }
}
