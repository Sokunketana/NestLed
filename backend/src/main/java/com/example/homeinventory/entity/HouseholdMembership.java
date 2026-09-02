package com.example.homeinventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "household_memberships")
public class HouseholdMembership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "app_user_id", nullable = false)
    private AppUser user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private HouseholdRole role;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    protected HouseholdMembership() {}

    public HouseholdMembership(Household household, AppUser user, HouseholdRole role) {
        this.household = household;
        this.user = user;
        this.role = role;
    }

    @PrePersist
    void onCreate() {
        joinedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Household getHousehold() { return household; }
    public AppUser getUser() { return user; }
    public HouseholdRole getRole() { return role; }
    public Instant getJoinedAt() { return joinedAt; }

    public void moveTo(Household household, HouseholdRole role) {
        this.household = household;
        this.role = role;
    }
}
