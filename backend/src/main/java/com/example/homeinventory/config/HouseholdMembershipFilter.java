package com.example.homeinventory.config;

import com.example.homeinventory.entity.AppUser;
import com.example.homeinventory.service.AppUserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class HouseholdMembershipFilter extends OncePerRequestFilter {
    private final AppUserService appUserService;

    public HouseholdMembershipFilter(AppUserService appUserService) {
        this.appUserService = appUserService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/")
                || path.startsWith("/api/auth/")
                || path.startsWith("/api/invitations/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof OidcUser oidcUser) {
            AppUser user = appUserService.getRequired(oidcUser);
            if (user.getHousehold() == null || user.getHouseholdRole() == null) {
                response.sendError(HttpStatus.FORBIDDEN.value(), "This account is not a household member");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}
