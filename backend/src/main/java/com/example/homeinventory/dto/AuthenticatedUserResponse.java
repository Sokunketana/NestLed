package com.example.homeinventory.dto;

import com.example.homeinventory.entity.HouseholdRole;

public record AuthenticatedUserResponse(
        Long id,
        String email,
        String displayName,
        String pictureUrl,
        Long householdId,
        String householdName,
        HouseholdRole householdRole,
        PendingHouseholdInvitationResponse pendingInvitation) {}
