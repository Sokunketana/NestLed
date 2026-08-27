package com.example.homeinventory.controller;

import com.example.homeinventory.dto.StorageLocationRequest;
import com.example.homeinventory.dto.StorageLocationResponse;
import com.example.homeinventory.service.StorageLocationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/storage-locations")
public class StorageLocationController {
    private final StorageLocationService service;

    public StorageLocationController(StorageLocationService service) { 
        this.service = service; 
    }

    @GetMapping public List<StorageLocationResponse> findAll() { 
        return service.findAll(); 
    }

    @GetMapping("/{id}") public StorageLocationResponse findById(@PathVariable Long id) { 
        return service.findById(id); 
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public StorageLocationResponse create(@Valid @RequestBody StorageLocationRequest request) { 
        return service.create(request); 
    }

    @PutMapping("/{id}")
    public StorageLocationResponse update(@PathVariable Long id, @Valid @RequestBody StorageLocationRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { 
        service.delete(id); 
    }
}
