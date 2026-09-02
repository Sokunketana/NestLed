package com.example.homeinventory.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 7)
    private String color;

    // Nullable in the entity only so existing installations can be backfilled by schema.sql.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id")
    private Household household;

    @OneToMany(mappedBy = "category")
    private List<Item> items = new ArrayList<>();

    public Category() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public Household getHousehold() { return household; }
    public void setHousehold(Household household) { this.household = household; }
    public List<Item> getItems() { return items; }
}
