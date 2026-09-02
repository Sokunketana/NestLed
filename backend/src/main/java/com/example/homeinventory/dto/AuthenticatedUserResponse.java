package com.example.homeinventory.dto;

import com.example.homeinventory.entity.HouseholdRole;
import java.util.List;

public record AuthenticatedUserResponse(
        Long id,
        String email,
        String displayName,
        String pictureUrl,
        Long householdId,
        String householdName,
        HouseholdRole householdRole,
        List<HouseholdSummaryResponse> households,
        List<PendingHouseholdInvitationResponse> pendingInvitations) {}
