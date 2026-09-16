package com.example.homeinventory.dto;

import java.util.List;

public record HouseholdImportPreviewResponse(
        String sourceHouseholdName,
        int sourceVersion,
        String destinationHouseholdName,
        long roomsToCreate,
        long existingRooms,
        long locationsToCreate,
        long existingLocations,
        long categoriesToCreate,
        long existingCategories,
        long itemsToImport,
        long duplicateItems,
        long movementRecordsSkipped,
        List<ImportIssue> errors,
        List<ImportIssue> warnings,
        boolean canImport
) {
    public record ImportIssue(String path, String message) {}
}
