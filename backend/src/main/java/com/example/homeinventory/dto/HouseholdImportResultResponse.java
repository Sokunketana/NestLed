package com.example.homeinventory.dto;

public record HouseholdImportResultResponse(
        String sourceHouseholdName,
        String destinationHouseholdName,
        long roomsCreated,
        long locationsCreated,
        long categoriesCreated,
        long itemsImported,
        long duplicateItemsImported,
        long movementRecordsSkipped
) {}
