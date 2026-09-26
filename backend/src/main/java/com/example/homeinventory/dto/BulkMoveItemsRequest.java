package com.example.homeinventory.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public record BulkMoveItemsRequest(
        @NotEmpty @Size(max = 200, message = "Select no more than 200 items at a time")
        List<@NotNull @Positive Long> itemIds,
        @NotNull @Positive Long roomId,
        @NotNull @Positive Long storageLocationId
) {}
