package com.example.homeinventory.service;

import com.example.homeinventory.dto.CreateItemRequest;
import com.example.homeinventory.dto.ItemResponse;
import com.example.homeinventory.dto.UpdateItemRequest;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.entity.StorageLocation;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.ResourceNotFoundException;
import com.example.homeinventory.repository.ItemRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ItemService {
    private final ItemRepository itemRepository;
    private final RoomService roomService;
    private final CategoryService categoryService;
    private final StorageLocationService storageLocationService;

    public ItemService(ItemRepository itemRepository, RoomService roomService,
                       CategoryService categoryService, StorageLocationService storageLocationService) {
        this.itemRepository = itemRepository;
        this.roomService = roomService;
        this.categoryService = categoryService;
        this.storageLocationService = storageLocationService;
    }

    public List<ItemResponse> findAll(Long roomId, Long categoryId) {
        List<Item> items;
        if (roomId != null && categoryId != null) {
            items = itemRepository.findByRoomIdAndCategoryIdOrderByNameAsc(roomId, categoryId);
        } else if (roomId != null) {
            items = itemRepository.findByRoomIdOrderByNameAsc(roomId);
        } else if (categoryId != null) {
            items = itemRepository.findByCategoryIdOrderByNameAsc(categoryId);
        } else {
            items = itemRepository.findAll();
        }
        return items.stream().map(this::toResponse).toList();
    }

    public List<ItemResponse> search(String name) {
        return itemRepository.findByNameContainingIgnoreCaseOrderByNameAsc(name.trim())
                .stream().map(this::toResponse).toList();
    }

    public ItemResponse findById(Long id) { return toResponse(getEntity(id)); }

    @Transactional
    public ItemResponse create(CreateItemRequest request) {
        Item item = new Item();
        copy(item, request.name(), request.description(), request.quantity(), request.categoryId(),
                request.roomId(), request.storageLocationId(), request.estimatedValue(), request.purchaseDate(),
                request.warrantyExpirationDate(), request.condition(), request.notes());
        return toResponse(itemRepository.save(item));
    }

    @Transactional
    public ItemResponse update(Long id, UpdateItemRequest request) {
        Item item = getEntity(id);
        copy(item, request.name(), request.description(), request.quantity(), request.categoryId(),
                request.roomId(), request.storageLocationId(), request.estimatedValue(), request.purchaseDate(),
                request.warrantyExpirationDate(), request.condition(), request.notes());
        return toResponse(itemRepository.save(item));
    }

    @Transactional
    public void delete(Long id) { itemRepository.delete(getEntity(id)); }

    private Item getEntity(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item with id " + id + " was not found"));
    }

    private void copy(Item item, String name, String description, Integer quantity, Long categoryId,
                      Long roomId, Long storageLocationId, java.math.BigDecimal value,
                      java.time.LocalDate purchaseDate, java.time.LocalDate warrantyDate,
                      com.example.homeinventory.entity.ItemCondition condition, String notes) {
        item.setName(name.trim());
        item.setDescription(description);
        item.setQuantity(quantity);
        item.setCategory(categoryService.getEntity(categoryId));
        item.setRoom(roomService.getEntity(roomId));
        item.setStorageLocation(resolveLocation(storageLocationId, roomId));
        item.setEstimatedValue(value);
        item.setPurchaseDate(purchaseDate);
        item.setWarrantyExpirationDate(warrantyDate);
        item.setCondition(condition);
        item.setNotes(notes);
    }

    private StorageLocation resolveLocation(Long locationId, Long roomId) {
        if (locationId == null) return null;
        StorageLocation location = storageLocationService.getEntity(locationId);
        if (!location.getRoom().getId().equals(roomId)) {
            throw new BadRequestException("The storage location does not belong to the selected room");
        }
        return location;
    }

    // Manual mapping keeps persistence details out of the HTTP response and avoids circular JSON.
    private ItemResponse toResponse(Item item) {
        StorageLocation location = item.getStorageLocation();
        return new ItemResponse(item.getId(), item.getName(), item.getDescription(), item.getQuantity(),
                item.getCategory().getId(), item.getCategory().getName(), item.getCategory().getColor(),
                item.getRoom().getId(), item.getRoom().getName(),
                location == null ? null : location.getId(), location == null ? null : location.getName(),
                item.getEstimatedValue(), item.getPurchaseDate(), item.getWarrantyExpirationDate(),
                item.getCondition(), item.getNotes(), item.getCreatedAt(), item.getUpdatedAt());
    }
}
