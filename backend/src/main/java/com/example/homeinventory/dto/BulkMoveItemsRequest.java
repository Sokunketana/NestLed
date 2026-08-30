package com.example.homeinventory.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

public record BulkMoveItemsRequest(
        @NotEmpty List<@NotNull @Positive Long> itemIds,
        @NotNull @Positive Long roomId,
        @NotNull @Positive Long storageLocationId
) {}
