package com.example.homeinventory.service;

import com.example.homeinventory.dto.ItemMovementResponse;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.entity.ItemMovement;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.entity.StorageLocation;
import com.example.homeinventory.repository.ItemMovementRepository;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ItemMovementService {
    private final ItemMovementRepository movementRepository;
    private final HouseholdAccessService householdAccessService;

    public ItemMovementService(ItemMovementRepository movementRepository,
                               HouseholdAccessService householdAccessService) {
        this.movementRepository = movementRepository;
        this.householdAccessService = householdAccessService;
    }

    public List<ItemMovementResponse> findAll() {
        return movementRepository.findByHouseholdIdOrderByMovedAtDescIdDesc(
                        householdAccessService.getActiveHousehold().getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void recordMove(Item item, Room fromRoom, StorageLocation fromLocation) {
        boolean roomChanged = !Objects.equals(fromRoom.getId(), item.getRoom().getId());
        boolean locationChanged = !Objects.equals(fromLocation.getId(), item.getStorageLocation().getId());
        if (roomChanged || locationChanged) {
            movementRepository.save(new ItemMovement(item, fromRoom, fromLocation));
        }
    }

    private ItemMovementResponse toResponse(ItemMovement movement) {
        return new ItemMovementResponse(
                movement.getId(), movement.getItemId(), movement.getItemName(),
                movement.getFromRoomId(), movement.getFromRoomName(),
                movement.getFromLocationId(), movement.getFromLocationName(),
                movement.getToRoomId(), movement.getToRoomName(),
                movement.getToLocationId(), movement.getToLocationName(), movement.getMovedAt());
    }
}
