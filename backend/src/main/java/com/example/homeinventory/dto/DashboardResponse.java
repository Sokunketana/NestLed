package com.example.homeinventory.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
        long totalItems,
        long totalRooms,
        long totalCategories,
        BigDecimal totalEstimatedValue,
        List<RoomResponse> rooms
) {}
