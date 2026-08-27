package com.example.homeinventory.service;

import com.example.homeinventory.dto.RoomRequest;
import com.example.homeinventory.dto.RoomResponse;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.ResourceNotFoundException;
import com.example.homeinventory.repository.ItemRepository;
import com.example.homeinventory.repository.RoomRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class RoomService {
    private final RoomRepository roomRepository;
    private final ItemRepository itemRepository;

    public RoomService(RoomRepository roomRepository, ItemRepository itemRepository) {
        this.roomRepository = roomRepository;
        this.itemRepository = itemRepository;
    }

    public List<RoomResponse> findAll() {
        return roomRepository.findAll().stream().map(this::toResponse).toList();
    }

    public RoomResponse findById(Long id) { return toResponse(getEntity(id)); }

    @Transactional
    public RoomResponse create(RoomRequest request) {
        ensureUniqueName(request.name(), null);
        Room room = new Room();
        copy(request, room);
        return toResponse(roomRepository.save(room));
    }

    @Transactional
    public RoomResponse update(Long id, RoomRequest request) {
        Room room = getEntity(id);
        ensureUniqueName(request.name(), room.getName());
        copy(request, room);
        return toResponse(roomRepository.save(room));
    }

    @Transactional
    public void delete(Long id) { roomRepository.delete(getEntity(id)); }

    public Room getEntity(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room with id " + id + " was not found"));
    }

    public RoomResponse toResponse(Room room) {
        return new RoomResponse(room.getId(), room.getName(), room.getDescription(),
                itemRepository.countByRoomId(room.getId()));
    }

    private void copy(RoomRequest request, Room room) {
        room.setName(request.name().trim());
        room.setDescription(request.description());
    }

    private void ensureUniqueName(String name, String currentName) {
        if ((currentName == null || !currentName.equalsIgnoreCase(name.trim()))
                && roomRepository.existsByNameIgnoreCase(name.trim())) {
            throw new BadRequestException("A room named '" + name.trim() + "' already exists");
        }
    }
}
