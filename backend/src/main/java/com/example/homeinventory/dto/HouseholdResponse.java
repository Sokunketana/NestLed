package com.example.homeinventory.dto;

import com.example.homeinventory.entity.HouseholdRole;
import java.util.List;

public record HouseholdResponse(
        Long id,
        String name,
        HouseholdRole currentUserRole,
        List<HouseholdMemberResponse> members,
        List<HouseholdInvitationResponse> pendingInvitations) {}
