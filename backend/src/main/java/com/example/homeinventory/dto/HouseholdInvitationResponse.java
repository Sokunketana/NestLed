package com.example.homeinventory.dto;

import java.time.Instant;

public record HouseholdInvitationResponse(Long id, String email, Instant createdAt) {}
