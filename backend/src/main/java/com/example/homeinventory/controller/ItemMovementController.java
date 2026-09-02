package com.example.homeinventory.controller;

import com.example.homeinventory.dto.ItemMovementResponse;
import com.example.homeinventory.service.ItemMovementService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/item-movements")
public class ItemMovementController {
    private final ItemMovementService movementService;

    public ItemMovementController(ItemMovementService movementService) {
        this.movementService = movementService;
    }

    @GetMapping
    public List<ItemMovementResponse> findAll() {
        return movementService.findAll();
    }
}
