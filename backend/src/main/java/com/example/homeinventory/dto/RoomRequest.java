package com.example.homeinventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RoomRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 500) String description,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "must be a hex color such as #2563EB") String color
) {
    public RoomRequest(String name, String description) {
        this(name, description, null);
    }
}
