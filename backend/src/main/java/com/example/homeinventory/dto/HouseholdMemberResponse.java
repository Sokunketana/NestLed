package com.example.homeinventory.dto;

import com.example.homeinventory.entity.HouseholdRole;

public record HouseholdMemberResponse(
        Long id,
        String email,
        String displayName,
        String pictureUrl,
        HouseholdRole role) {}
