package com.example.homeinventory.dto;

public record StorageLocationResponse(
        Long id, String name, String description, String color, Long roomId, String roomName, long itemCount
) {}
