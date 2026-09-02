package com.example.homeinventory.repository;

import com.example.homeinventory.entity.AppUser;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    @EntityGraph(attributePaths = "household")
    Optional<AppUser> findByOidcIssuerAndOidcSubject(String oidcIssuer, String oidcSubject);
}
