package com.example.homeinventory.dto;

public record AuthenticatedUserResponse(
        Long id,
        String email,
        String displayName,
        String pictureUrl) {}
