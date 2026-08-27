package com.example.homeinventory.controller;

import com.example.homeinventory.dto.RoomRequest;
import com.example.homeinventory.dto.RoomResponse;
import com.example.homeinventory.dto.StorageLocationResponse;
import com.example.homeinventory.service.RoomService;
import com.example.homeinventory.service.StorageLocationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    private final RoomService roomService;
    private final StorageLocationService storageLocationService;
    
    public RoomController(RoomService roomService, StorageLocationService storageLocationService) {
        this.roomService = roomService;
        this.storageLocationService = storageLocationService;
    }

    @GetMapping public List<RoomResponse> findAll() { 
        return roomService.findAll(); 
    }

    @GetMapping("/{id}") public RoomResponse findById(@PathVariable Long id) { 
        return roomService.findById(id); 
    }

    @GetMapping("/{roomId}/storage-locations")
    public List<StorageLocationResponse> locations(@PathVariable Long roomId) {
        return storageLocationService.findByRoom(roomId);
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public RoomResponse create(@Valid @RequestBody RoomRequest request) { 
        return roomService.create(request); 
    }

    @PutMapping("/{id}")
    public RoomResponse update(@PathVariable Long id, @Valid @RequestBody RoomRequest request) {
        return roomService.update(id, request);
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { 
        roomService.delete(id); 
    }
}
