package com.example.homeinventory.service;

import com.example.homeinventory.config.AuthProperties;
import com.example.homeinventory.dto.AuthenticatedUserResponse;
import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.HouseholdInvitation;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.repository.AppUserRepository;
import com.example.homeinventory.repository.HouseholdInvitationRepository;
import com.example.homeinventory.repository.HouseholdRepository;
import java.net.URL;
import java.util.Locale;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AppUserService {
    private static final String ACCESS_DENIED = "access_denied";

    private final AppUserRepository userRepository;
    private final HouseholdRepository householdRepository;
    private final HouseholdInvitationRepository invitationRepository;
    private final AuthProperties authProperties;

    public AppUserService(AppUserRepository userRepository, HouseholdRepository householdRepository,
                          HouseholdInvitationRepository invitationRepository, AuthProperties authProperties) {
        this.userRepository = userRepository;
        this.householdRepository = householdRepository;
        this.invitationRepository = invitationRepository;
        this.authProperties = authProperties;
    }

    @Transactional
    public AppUser synchronize(OidcUser oidcUser) {
        String email = normalizeEmail(oidcUser.getEmail());
        if (!Boolean.TRUE.equals(oidcUser.getEmailVerified())) {
            throw denied("The identity provider has not verified this email address");
        }
        String issuer = requireIssuer(oidcUser.getIssuer());
        String subject = requireClaim(oidcUser.getSubject(), "The identity provider did not supply a subject");
        String displayName = normalizeOptional(oidcUser.getFullName());
        String pictureUrl = normalizeOptional(oidcUser.getPicture());

        AppUser appUser = userRepository.findByOidcIssuerAndOidcSubject(issuer, subject).orElse(null);
        if (appUser != null && appUser.getHousehold() != null) {
            appUser.updateProfile(email, displayName, pictureUrl);
            return userRepository.save(appUser);
        }

        HouseholdInvitation invitation = invitationRepository
                .findByEmailIgnoreCase(email).orElse(null);

        Household bootstrapHousehold = null;
        if (invitation == null) {
            bootstrapHousehold = householdRepository.findFirstByOrderByIdAsc().orElse(null);
            if (bootstrapHousehold != null || !isConfiguredBootstrapAccount(email)) {
                throw denied("This account has not been invited to the household");
            }
        }

        if (appUser == null) {
            appUser = new AppUser(issuer, subject, email, displayName, pictureUrl);
        }
        appUser.updateProfile(email, displayName, pictureUrl);

        if (invitation != null) {
            appUser.joinHousehold(invitation.getHousehold(), HouseholdRole.MEMBER);
            invitationRepository.delete(invitation);
        } else {
            Household household = householdRepository.save(new Household(defaultHouseholdName(displayName)));
            appUser.joinHousehold(household, HouseholdRole.OWNER);
        }
        return userRepository.save(appUser);
    }

    private boolean isConfiguredBootstrapAccount(String email) {
        if (authProperties.allowAll()) {
            return true;
        }
        if (authProperties.allowedEmails().isEmpty()) {
            return false;
        }
        return authProperties.allowedEmails().contains(email);
    }

    private String defaultHouseholdName(String displayName) {
        return StringUtils.hasText(displayName) ? displayName.trim() + "'s household" : "My household";
    }

    @Transactional(readOnly = true)
    public AppUser getRequired(OidcUser oidcUser) {
        String issuer = requireIssuer(oidcUser.getIssuer());
        String subject = requireClaim(oidcUser.getSubject(), "The identity provider did not supply a subject");
        return userRepository.findByOidcIssuerAndOidcSubject(issuer, subject)
                .orElseThrow(() -> denied("The signed-in account is not registered"));
    }

    @Transactional(readOnly = true)
    public AuthenticatedUserResponse getProfile(OidcUser oidcUser) {
        AppUser appUser = getRequired(oidcUser);
        Household household = appUser.getHousehold();
        if (household == null || appUser.getHouseholdRole() == null) {
            throw new AccessDeniedException("This account is not a household member");
        }
        return new AuthenticatedUserResponse(
                appUser.getId(),
                appUser.getEmail(),
                appUser.getDisplayName(),
                appUser.getPictureUrl(),
                household.getId(),
                household.getName(),
                appUser.getHouseholdRole());
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
