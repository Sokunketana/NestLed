package com.example.homeinventory.dto;

public record BulkMoveItemsResponse(
        int movedCount,
        Long roomId,
        String roomName,
        Long storageLocationId,
        String storageLocationName
) {}
