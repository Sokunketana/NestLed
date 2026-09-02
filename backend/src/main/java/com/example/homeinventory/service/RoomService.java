package com.example.homeinventory.service;

import com.example.homeinventory.dto.RoomRequest;
import com.example.homeinventory.dto.RoomResponse;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.entity.Household;
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
    private final HouseholdAccessService householdAccessService;

    public RoomService(RoomRepository roomRepository, ItemRepository itemRepository,
                       HouseholdAccessService householdAccessService) {
        this.roomRepository = roomRepository;
        this.itemRepository = itemRepository;
        this.householdAccessService = householdAccessService;
    }

    public List<RoomResponse> findAll() {
        return roomRepository.findByHouseholdIdOrderByNameAsc(activeHousehold().getId())
                .stream().map(this::toResponse).toList();
    }

    public RoomResponse findById(Long id) { return toResponse(getEntity(id)); }

    @Transactional
    public RoomResponse create(RoomRequest request) {
        ensureUniqueName(request.name(), null);
        Room room = new Room();
        room.setHousehold(activeHousehold());
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
        return roomRepository.findByIdAndHouseholdId(id, activeHousehold().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Room with id " + id + " was not found"));
    }

    public RoomResponse toResponse(Room room) {
        return new RoomResponse(room.getId(), room.getName(), room.getDescription(),
                itemRepository.countByHouseholdIdAndRoomId(room.getHousehold().getId(), room.getId()));
    }

    private void copy(RoomRequest request, Room room) {
        room.setName(request.name().trim());
        room.setDescription(request.description());
    }

    private void ensureUniqueName(String name, String currentName) {
        if ((currentName == null || !currentName.equalsIgnoreCase(name.trim()))
                && roomRepository.existsByHouseholdIdAndNameIgnoreCase(
                        activeHousehold().getId(), name.trim())) {
            throw new BadRequestException("A room named '" + name.trim() + "' already exists");
        }
    }

    private Household activeHousehold() {
        return householdAccessService.getActiveHousehold();
    }
}
