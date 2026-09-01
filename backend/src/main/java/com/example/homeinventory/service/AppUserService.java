package com.example.homeinventory.service;

import com.example.homeinventory.config.AuthProperties;
import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.repository.AppUserRepository;
import java.net.URL;
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
    private final AuthProperties authProperties;

    public AppUserService(AppUserRepository userRepository, AuthProperties authProperties) {
        this.userRepository = userRepository;
        this.authProperties = authProperties;
    }

    @Transactional
    public AppUser synchronize(OidcUser oidcUser) {
        String email = normalizeEmail(oidcUser.getEmail());
        if (!Boolean.TRUE.equals(oidcUser.getEmailVerified())) {
            throw denied("The identity provider has not verified this email address");
        }
        if (authProperties.allowedEmails().isEmpty()) {
            throw denied("No permitted accounts have been configured");
        }
        if (!authProperties.allowedEmails().contains(email)) {
            throw denied("This account has not been invited");
        }

        String issuer = requireIssuer(oidcUser.getIssuer());
        String subject = requireClaim(oidcUser.getSubject(), "The identity provider did not supply a subject");
        String displayName = normalizeOptional(oidcUser.getFullName());
        String pictureUrl = normalizeOptional(oidcUser.getPicture());

        AppUser appUser = userRepository.findByOidcIssuerAndOidcSubject(issuer, subject)
                .orElseGet(() -> new AppUser(issuer, subject, email, displayName, pictureUrl));
        appUser.updateProfile(email, displayName, pictureUrl);
        return userRepository.save(appUser);
    }

    @Transactional(readOnly = true)
    public AppUser getRequired(OidcUser oidcUser) {
        String issuer = requireIssuer(oidcUser.getIssuer());
        String subject = requireClaim(oidcUser.getSubject(), "The identity provider did not supply a subject");
        return userRepository.findByOidcIssuerAndOidcSubject(issuer, subject)
                .orElseThrow(() -> denied("The signed-in account is not registered"));
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
