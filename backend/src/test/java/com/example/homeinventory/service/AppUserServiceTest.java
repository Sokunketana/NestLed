package com.example.homeinventory.service;

import com.example.homeinventory.config.AuthProperties;
import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.repository.AppUserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppUserServiceTest {
    @Mock
    private AppUserRepository userRepository;

    @Test
    void createsLocalUserForAllowlistedVerifiedIdentity() {
        AppUserService service = new AppUserService(
                userRepository,
                new AuthProperties("http://localhost:5173", List.of("person@example.com"), false));
        OidcUser oidcUser = oidcUser("Person@Example.com", true);
        when(userRepository.findByOidcIssuerAndOidcSubject(
                "https://accounts.google.com", "google-subject-123"))
                .thenReturn(Optional.empty());
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.synchronize(oidcUser);

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(captor.capture());
        assertEquals("https://accounts.google.com", captor.getValue().getOidcIssuer());
        assertEquals("google-subject-123", captor.getValue().getOidcSubject());
        assertEquals("person@example.com", captor.getValue().getEmail());
        assertEquals("Person Example", captor.getValue().getDisplayName());
    }

    @Test
    void rejectsIdentityThatHasNotBeenInvited() {
        AppUserService service = new AppUserService(
                userRepository,
                new AuthProperties("http://localhost:5173", List.of("owner@example.com"), false));

        OAuth2AuthenticationException exception = assertThrows(
                OAuth2AuthenticationException.class,
                () -> service.synchronize(oidcUser("other@example.com", true)));

        assertEquals("access_denied", exception.getError().getErrorCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    void rejectsUnverifiedEmail() {
        AppUserService service = new AppUserService(
                userRepository,
                new AuthProperties("http://localhost:5173", List.of("person@example.com"), false));

        OAuth2AuthenticationException exception = assertThrows(
                OAuth2AuthenticationException.class,
                () -> service.synchronize(oidcUser("person@example.com", false)));

        assertEquals("access_denied", exception.getError().getErrorCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    void createsLocalUserForAnyVerifiedIdentityWhenAllowAllIsEnabled() {
        AppUserService service = new AppUserService(
                userRepository,
                new AuthProperties("http://localhost:5173", List.of(), true));
        OidcUser oidcUser = oidcUser("anyone@example.com", true);
        when(userRepository.findByOidcIssuerAndOidcSubject(
                "https://accounts.google.com", "google-subject-123"))
                .thenReturn(Optional.empty());
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.synchronize(oidcUser);

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(captor.capture());
        assertEquals("anyone@example.com", captor.getValue().getEmail());
    }

    private OidcUser oidcUser(String email, boolean verified) {
        Instant issuedAt = Instant.now();
        OidcIdToken idToken = new OidcIdToken(
                "encoded-id-token",
                issuedAt,
                issuedAt.plusSeconds(300),
                Map.of(
                        "iss", "https://accounts.google.com",
                        "sub", "google-subject-123",
                        "email", email,
                        "email_verified", verified,
                        "name", "Person Example",
                        "picture", "https://example.com/person.jpg"));
        return new DefaultOidcUser(List.of(new SimpleGrantedAuthority("ROLE_USER")), idToken);
    }
}
