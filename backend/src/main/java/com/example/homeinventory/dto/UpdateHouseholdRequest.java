package com.example.homeinventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateHouseholdRequest(
        @NotBlank(message = "Household name is required")
        @Size(max = 100, message = "Household name must be 100 characters or fewer")
        String name) {}
