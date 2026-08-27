package com.example.homeinventory.dto;

import com.example.homeinventory.entity.ItemCondition;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateItemRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 1000) String description,
        @NotNull @Min(1) Integer quantity,
        @NotNull Long categoryId,
        @NotNull Long roomId,
        Long storageLocationId,
        @NotNull @PositiveOrZero BigDecimal estimatedValue,
        LocalDate purchaseDate,
        LocalDate warrantyExpirationDate,
        @NotNull ItemCondition condition,
        @Size(max = 2000) String notes
) {}
