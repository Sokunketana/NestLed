package com.example.homeinventory.dto;

import java.time.Instant;

public record DashboardActivityResponse(
        String type,
        Long itemId,
        String itemName,
        String roomName,
        String locationName,
        String fromRoomName,
        String fromLocationName,
        String toRoomName,
        String toLocationName,
        Instant occurredAt) {}
