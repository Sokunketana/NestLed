package com.example.homeinventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RoomRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 500) String description
) {}
