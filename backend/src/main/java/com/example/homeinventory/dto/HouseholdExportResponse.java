package com.example.homeinventory.dto;

import com.example.homeinventory.entity.ItemCondition;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Portable household data. Database IDs are intentionally omitted so this
 * shape can be imported into a different household later.
 */
public record HouseholdExportResponse(
        String format,
        int version,
        Instant exportedAt,
        HouseholdData household,
        List<RoomData> rooms,
        List<StorageLocationData> storageLocations,
        List<CategoryData> categories,
        List<ItemData> items,
        List<MovementData> movementHistory
) {
    public record HouseholdData(String name) {}

    public record RoomData(
            String name,
            String description,
            String color
    ) {}

    public record StorageLocationData(
            String name,
            String description,
            String color,
            String roomName
    ) {}

    public record CategoryData(
            String name,
            String color
    ) {}

    public record ItemData(
            String name,
            String description,
            Integer quantity,
            String categoryName,
            String roomName,
            String storageLocationName,
            BigDecimal estimatedValue,
            LocalDate purchaseDate,
            LocalDate warrantyExpirationDate,
            ItemCondition condition,
            String notes,
            boolean photoAvailable,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {}

    public record MovementData(
            String itemName,
            String fromRoomName,
            String fromLocationName,
            String toRoomName,
            String toLocationName,
            Instant movedAt
    ) {}
}
