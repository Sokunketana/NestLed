package com.example.homeinventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateDisplayNameRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 200, message = "Name must be 200 characters or fewer")
        String displayName) {}
