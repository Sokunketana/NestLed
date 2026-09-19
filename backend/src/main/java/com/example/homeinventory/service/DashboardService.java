package com.example.homeinventory.service;

import com.example.homeinventory.dto.DashboardActivityResponse;
import com.example.homeinventory.dto.DashboardResponse;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.entity.ItemMovement;
import com.example.homeinventory.repository.CategoryRepository;
import com.example.homeinventory.repository.ItemRepository;
import com.example.homeinventory.repository.ItemMovementRepository;
import com.example.homeinventory.repository.RoomRepository;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {
    private final ItemRepository itemRepository;
    private final ItemMovementRepository movementRepository;
    private final RoomRepository roomRepository;
    private final CategoryRepository categoryRepository;
    private final RoomService roomService;
    private final HouseholdAccessService householdAccessService;

    public DashboardService(ItemRepository itemRepository, ItemMovementRepository movementRepository,
                            RoomRepository roomRepository,
                            CategoryRepository categoryRepository, RoomService roomService,
                            HouseholdAccessService householdAccessService) {
        this.itemRepository = itemRepository;
        this.movementRepository = movementRepository;
        this.roomRepository = roomRepository;
        this.categoryRepository = categoryRepository;
        this.roomService = roomService;
        this.householdAccessService = householdAccessService;
    }

    public DashboardResponse getDashboard() {
        Long householdId = householdAccessService.getActiveHousehold().getId();
        return new DashboardResponse(itemRepository.countByHouseholdId(householdId),
                roomRepository.countByHouseholdId(householdId),
                categoryRepository.countByHouseholdId(householdId),
                itemRepository.totalEstimatedValue(householdId), roomService.findAll(), recentActivity(householdId));
    }

    private List<DashboardActivityResponse> recentActivity(Long householdId) {
        List<DashboardActivityResponse> itemActivity = itemRepository
                .findTop8ByHouseholdIdOrderByCreatedAtDescIdDesc(householdId)
                .stream()
                .map(this::itemAddedActivity)
                .toList();
        List<DashboardActivityResponse> movementActivity = movementRepository
                .findTop8ByHouseholdIdOrderByMovedAtDescIdDesc(householdId)
                .stream()
                .map(this::movementActivity)
                .toList();

        return java.util.stream.Stream.concat(itemActivity.stream(), movementActivity.stream())
                .sorted(Comparator.comparing(DashboardActivityResponse::occurredAt).reversed())
                .limit(8)
                .toList();
    }

    private DashboardActivityResponse itemAddedActivity(Item item) {
        return new DashboardActivityResponse("ITEM_ADDED", item.getId(), item.getName(),
                item.getRoom().getName(), item.getStorageLocation().getName(),
                null, null, null, null,
                item.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant());
    }

    private DashboardActivityResponse movementActivity(ItemMovement movement) {
        return new DashboardActivityResponse("ITEM_MOVED", movement.getItemId(), movement.getItemName(),
                null, null, movement.getFromRoomName(), movement.getFromLocationName(),
                movement.getToRoomName(), movement.getToLocationName(), movement.getMovedAt());
    }
}
