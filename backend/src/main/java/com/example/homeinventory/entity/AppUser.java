package com.example.homeinventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(
        name = "app_users",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_app_users_oidc_identity",
                columnNames = {"oidc_issuer", "oidc_subject"}))
public class AppUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "oidc_issuer", nullable = false, length = 255)
    private String oidcIssuer;

    @Column(name = "oidc_subject", nullable = false, length = 255)
    private String oidcSubject;

    @Column(nullable = false, length = 320)
    private String email;

    @Column(name = "display_name", length = 200)
    private String displayName;

    @Column(name = "picture_url", length = 1000)
    private String pictureUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AppUser() {}

    public AppUser(String oidcIssuer, String oidcSubject, String email, String displayName, String pictureUrl) {
        this.oidcIssuer = oidcIssuer;
        this.oidcSubject = oidcSubject;
        updateProfile(email, displayName, pictureUrl);
    }

    public void updateProfile(String email, String displayName, String pictureUrl) {
        this.email = email;
        this.displayName = displayName;
        this.pictureUrl = pictureUrl;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getOidcIssuer() { return oidcIssuer; }
    public String getOidcSubject() { return oidcSubject; }
    public String getEmail() { return email; }
    public String getDisplayName() { return displayName; }
    public String getPictureUrl() { return pictureUrl; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
