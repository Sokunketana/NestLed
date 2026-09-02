package com.example.homeinventory.dto;

import java.time.Instant;

public record ItemMovementResponse(
        Long id,
        Long itemId,
        String itemName,
        Long fromRoomId,
        String fromRoomName,
        Long fromLocationId,
        String fromLocationName,
        Long toRoomId,
        String toRoomName,
        Long toLocationId,
        String toLocationName,
        Instant movedAt) {}
