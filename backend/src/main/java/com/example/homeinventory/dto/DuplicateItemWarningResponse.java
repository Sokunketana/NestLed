package com.example.homeinventory.dto;

import java.time.Instant;
import java.util.List;

public record DuplicateItemWarningResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        List<ItemResponse> duplicateItems
) {}
