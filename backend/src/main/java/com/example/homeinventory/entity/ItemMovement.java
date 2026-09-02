package com.example.homeinventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "item_movements", indexes = {
        @Index(name = "idx_item_movements_household_moved_at", columnList = "household_id,moved_at"),
        @Index(name = "idx_item_movements_item_id", columnList = "item_id")
})
public class ItemMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;

    // This is deliberately a snapshot ID rather than a foreign key. Movement history
    // remains readable after an item is deleted.
    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "item_name", nullable = false, length = 150)
    private String itemName;

    @Column(name = "from_room_id", nullable = false)
    private Long fromRoomId;

    @Column(name = "from_room_name", nullable = false, length = 100)
    private String fromRoomName;

    @Column(name = "from_location_id", nullable = false)
    private Long fromLocationId;

    @Column(name = "from_location_name", nullable = false, length = 100)
    private String fromLocationName;

    @Column(name = "to_room_id", nullable = false)
    private Long toRoomId;

    @Column(name = "to_room_name", nullable = false, length = 100)
    private String toRoomName;

    @Column(name = "to_location_id", nullable = false)
    private Long toLocationId;

    @Column(name = "to_location_name", nullable = false, length = 100)
    private String toLocationName;

    @Column(name = "moved_at", nullable = false, updatable = false)
    private Instant movedAt;

    protected ItemMovement() {}

    public ItemMovement(Item item, Room fromRoom, StorageLocation fromLocation) {
        this.household = item.getHousehold();
        this.itemId = item.getId();
        this.itemName = item.getName();
        this.fromRoomId = fromRoom.getId();
        this.fromRoomName = fromRoom.getName();
        this.fromLocationId = fromLocation.getId();
        this.fromLocationName = fromLocation.getName();
        this.toRoomId = item.getRoom().getId();
        this.toRoomName = item.getRoom().getName();
        this.toLocationId = item.getStorageLocation().getId();
        this.toLocationName = item.getStorageLocation().getName();
    }

    @PrePersist
    void onCreate() {
        movedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Household getHousehold() { return household; }
    public Long getItemId() { return itemId; }
    public String getItemName() { return itemName; }
    public Long getFromRoomId() { return fromRoomId; }
    public String getFromRoomName() { return fromRoomName; }
    public Long getFromLocationId() { return fromLocationId; }
    public String getFromLocationName() { return fromLocationName; }
    public Long getToRoomId() { return toRoomId; }
    public String getToRoomName() { return toRoomName; }
    public Long getToLocationId() { return toLocationId; }
    public String getToLocationName() { return toLocationName; }
    public Instant getMovedAt() { return movedAt; }
}
