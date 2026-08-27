package com.example.homeinventory.dto;

import com.example.homeinventory.entity.ItemCondition;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ItemResponse(
        Long id,
        String name,
        String description,
        Integer quantity,
        Long categoryId,
        String categoryName,
        String categoryColor,
        Long roomId,
        String roomName,
        Long storageLocationId,
        String storageLocationName,
        BigDecimal estimatedValue,
        LocalDate purchaseDate,
        LocalDate warrantyExpirationDate,
        ItemCondition condition,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
