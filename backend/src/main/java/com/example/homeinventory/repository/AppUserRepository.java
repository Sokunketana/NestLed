package com.example.homeinventory.repository;

import com.example.homeinventory.entity.AppUser;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    @EntityGraph(attributePaths = "household")
    Optional<AppUser> findByOidcIssuerAndOidcSubject(String oidcIssuer, String oidcSubject);
    List<AppUser> findByHouseholdIdOrderByDisplayNameAscEmailAsc(Long householdId);
    boolean existsByHouseholdIdAndEmailIgnoreCase(Long householdId, String email);
}
