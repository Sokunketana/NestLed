package com.example.homeinventory.controller;

import com.example.homeinventory.dto.DashboardResponse;
import com.example.homeinventory.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardService service;
    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping 
    public DashboardResponse getDashboard() {
        return service.getDashboard(); 
    }
}
