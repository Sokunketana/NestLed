package com.example.homeinventory.service;

import com.example.homeinventory.dto.StorageLocationRequest;
import com.example.homeinventory.dto.StorageLocationResponse;
import com.example.homeinventory.entity.StorageLocation;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.ResourceNotFoundException;
import com.example.homeinventory.repository.ItemRepository;
import com.example.homeinventory.repository.StorageLocationRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class StorageLocationService {
    private final StorageLocationRepository repository;
    private final RoomService roomService;
    private final ItemRepository itemRepository;

    public StorageLocationService(StorageLocationRepository repository, RoomService roomService,
                                  ItemRepository itemRepository) {
        this.repository = repository;
        this.roomService = roomService;
        this.itemRepository = itemRepository;
    }

    public List<StorageLocationResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public List<StorageLocationResponse> findByRoom(Long roomId) {
        roomService.getEntity(roomId);
        return repository.findByRoomIdOrderByNameAsc(roomId).stream().map(this::toResponse).toList();
    }

    public StorageLocationResponse findById(Long id) { return toResponse(getEntity(id)); }

    @Transactional
    public StorageLocationResponse create(StorageLocationRequest request) {
        StorageLocation location = new StorageLocation();
        copy(request, location);
        return toResponse(repository.save(location));
    }

    @Transactional
    public StorageLocationResponse update(Long id, StorageLocationRequest request) {
        StorageLocation location = getEntity(id);
        if (!location.getRoom().getId().equals(request.roomId())
                && itemRepository.countByStorageLocationId(id) > 0) {
            throw new BadRequestException("Move the items out of this storage location before changing its room");
        }
        copy(request, location);
        return toResponse(repository.save(location));
    }

    @Transactional
    public void delete(Long id) { repository.delete(getEntity(id)); }

    public StorageLocation getEntity(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResourceNotFoundException("Storage location with id " + id + " was not found"));
    }

    private void copy(StorageLocationRequest request, StorageLocation location) {
        location.setName(request.name().trim());
        location.setDescription(request.description());
        location.setRoom(roomService.getEntity(request.roomId()));
    }

    private StorageLocationResponse toResponse(StorageLocation location) {
        return new StorageLocationResponse(location.getId(), location.getName(), location.getDescription(),
                location.getRoom().getId(), location.getRoom().getName(),
                itemRepository.countByStorageLocationId(location.getId()));
    }
}
