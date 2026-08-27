package com.example.homeinventory.controller;

import com.example.homeinventory.dto.CreateItemRequest;
import com.example.homeinventory.dto.ItemResponse;
import com.example.homeinventory.dto.UpdateItemRequest;
import com.example.homeinventory.service.ItemService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/items")
public class ItemController {
    private final ItemService itemService;
    public ItemController(ItemService itemService) { this.itemService = itemService; }

    @GetMapping
    public List<ItemResponse> findAll(@RequestParam(required = false) Long roomId, @RequestParam(required = false) Long categoryId) {
        return itemService.findAll(roomId, categoryId);
    }

    @GetMapping("/search")
    public List<ItemResponse> search(@RequestParam String name) { 
        return itemService.search(name); 
    }

    @GetMapping("/{id}")
    public ItemResponse findById(@PathVariable Long id) { 
        return itemService.findById(id); 
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ItemResponse create(@Valid @RequestBody CreateItemRequest request) { 
        return itemService.create(request); 
    }

    @PutMapping("/{id}")
    public ItemResponse update(@PathVariable Long id, @Valid @RequestBody UpdateItemRequest request) {
        return itemService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        itemService.delete(id); 
    }
}
