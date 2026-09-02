package com.example.homeinventory.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    // Nullable in the entity only so existing installations can be backfilled by schema.sql.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id")
    private Household household;

    @OneToMany(mappedBy = "room")
    private List<StorageLocation> storageLocations = new ArrayList<>();

    @OneToMany(mappedBy = "room")
    private List<Item> items = new ArrayList<>();

    public Room() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Household getHousehold() { return household; }
    public void setHousehold(Household household) { this.household = household; }
    public List<StorageLocation> getStorageLocations() { return storageLocations; }
    public List<Item> getItems() { return items; }
}
