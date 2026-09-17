package com.example.homeinventory.dto;

public record HouseholdExportPreviewResponse(
        String format,
        String householdName,
        long roomCount,
        long storageLocationCount,
        long categoryCount,
        long itemCount,
        long movementCount,
        long photoCount,
        boolean movementHistoryIncluded
) {}
