package com.example.homeinventory.dto;

import java.time.Instant;

public record PendingHouseholdInvitationResponse(
        Long id,
        Long householdId,
        String householdName,
        Instant createdAt) {}
