package com.example.homeinventory.dto;

import com.example.homeinventory.entity.HouseholdRole;

public record HouseholdSummaryResponse(Long id, String name, HouseholdRole role) {}
