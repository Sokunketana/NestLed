package com.example.homeinventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record StorageLocationRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 500) String description,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "must be a hex color such as #2563EB") String color,
        @NotNull Long roomId
) {
    public StorageLocationRequest(String name, String description, Long roomId) {
        this(name, description, null, roomId);
    }
}
