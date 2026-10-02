package com.example.homeinventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TransferHouseholdOwnershipRequest(@NotNull @Positive Long memberId) {}
