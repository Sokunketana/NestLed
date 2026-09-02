package com.example.homeinventory.service;

import com.example.homeinventory.dto.BulkMoveItemsRequest;
import com.example.homeinventory.dto.BulkMoveItemsResponse;
import com.example.homeinventory.dto.CreateItemRequest;
import com.example.homeinventory.dto.ItemResponse;
import com.example.homeinventory.dto.UpdateItemRequest;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.entity.StorageLocation;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.ResourceNotFoundException;
import com.example.homeinventory.repository.ItemRepository;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional(readOnly = true)
public class ItemService {
    private static final Logger log = LoggerFactory.getLogger(ItemService.class);

    private final ItemRepository itemRepository;
    private final RoomService roomService;
    private final CategoryService categoryService;
    private final StorageLocationService storageLocationService;
    private final PhotoStorageService photoStorageService;
    private final HouseholdAccessService householdAccessService;
    private final ItemMovementService itemMovementService;

    public ItemService(ItemRepository itemRepository, RoomService roomService, CategoryService categoryService,
                       StorageLocationService storageLocationService, PhotoStorageService photoStorageService,
                       HouseholdAccessService householdAccessService, ItemMovementService itemMovementService) {
        this.itemRepository = itemRepository;
        this.roomService = roomService;
        this.categoryService = categoryService;
        this.storageLocationService = storageLocationService;
        this.photoStorageService = photoStorageService;
        this.householdAccessService = householdAccessService;
        this.itemMovementService = itemMovementService;
    }

    public List<ItemResponse> findAll(Long roomId, Long categoryId, Long storageLocationId) {
        Long householdId = activeHousehold().getId();
        List<Item> items;
        if (storageLocationId != null) {
            StorageLocation location = storageLocationService.getEntity(storageLocationId);
            if (roomId != null && !location.getRoom().getId().equals(roomId)) {
                throw new BadRequestException("The storage location does not belong to the selected room");
            }
            items = itemRepository.findByHouseholdIdAndStorageLocationIdOrderByNameAsc(
                    householdId, storageLocationId);
            if (categoryId != null) {
                items = items.stream().filter(item -> item.getCategory().getId().equals(categoryId)).toList();
            }
        } else if (roomId != null && categoryId != null) {
            items = itemRepository.findByHouseholdIdAndRoomIdAndCategoryIdOrderByNameAsc(
                    householdId, roomId, categoryId);
        } else if (roomId != null) {
            items = itemRepository.findByHouseholdIdAndRoomIdOrderByNameAsc(householdId, roomId);
        } else if (categoryId != null) {
            items = itemRepository.findByHouseholdIdAndCategoryIdOrderByNameAsc(householdId, categoryId);
        } else {
            items = itemRepository.findByHouseholdIdOrderByNameAsc(householdId);
        }
        return items.stream().map(this::toResponse).toList();
    }

    public List<ItemResponse> search(String name) {
        return itemRepository.findByHouseholdIdAndNameContainingIgnoreCaseOrderByNameAsc(
                        activeHousehold().getId(), name.trim())
                .stream().map(this::toResponse).toList();
    }

    public ItemResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

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
        Room previousRoom = item.getRoom();
        StorageLocation previousLocation = item.getStorageLocation();
        copy(item, request.name(), request.description(), request.quantity(), request.categoryId(),
                request.roomId(), request.storageLocationId(), request.estimatedValue(), request.purchaseDate(),
                request.warrantyExpirationDate(), request.condition(), request.notes());
        Item savedItem = itemRepository.save(item);
        itemMovementService.recordMove(savedItem, previousRoom, previousLocation);
        return toResponse(savedItem);
    }

    @Transactional
    public BulkMoveItemsResponse bulkMove(BulkMoveItemsRequest request) {
        Set<Long> itemIds = normalizedItemIds(request);
        Long householdId = activeHousehold().getId();
        Room destinationRoom = roomService.getEntity(request.roomId());
        StorageLocation destinationLocation = resolveLocation(request.storageLocationId(), request.roomId());

        List<Item> items = itemRepository.findByIdInAndHouseholdId(itemIds, householdId);
        Set<Long> foundIds = items.stream().map(Item::getId).collect(Collectors.toSet());
        List<Long> missingIds = itemIds.stream().filter(id -> !foundIds.contains(id)).toList();
        if (!missingIds.isEmpty()) {
            throw new ResourceNotFoundException("Items with ids " + missingIds + " were not found");
        }

        items.forEach(item -> {
            Room previousRoom = item.getRoom();
            StorageLocation previousLocation = item.getStorageLocation();
            item.setRoom(destinationRoom);
            item.setStorageLocation(destinationLocation);
            itemMovementService.recordMove(item, previousRoom, previousLocation);
        });
        itemRepository.saveAll(items);

        return new BulkMoveItemsResponse(items.size(), destinationRoom.getId(), destinationRoom.getName(),
                destinationLocation.getId(), destinationLocation.getName());
    }

    @Transactional
    public void delete(Long id) {
        Item item = getEntity(id);
        itemRepository.delete(item);
        itemRepository.flush();
        deletePhotoAfterCommit(item.getPhotoFilename());
    }

    @Transactional
    public ItemResponse updatePhoto(Long id, MultipartFile file) {
        Item item = getEntity(id);
        PhotoStorageService.StoredPhoto newPhoto = photoStorageService.store(file);
        String previousFilename = item.getPhotoFilename();
        try {
            item.setPhotoFilename(newPhoto.filename());
            item.setPhotoContentType(newPhoto.contentType());
            ItemResponse response = toResponse(itemRepository.saveAndFlush(item));
            finishPhotoReplacement(newPhoto.filename(), previousFilename);
            return response;
        } catch (RuntimeException ex) {
            try {
                photoStorageService.delete(newPhoto.filename());
            } catch (RuntimeException cleanupFailure) {
                ex.addSuppressed(cleanupFailure);
            }
            throw ex;
        }
    }

    public ItemPhoto findPhoto(Long id) {
        Item item = getEntity(id);
        if (item.getPhotoFilename() == null || item.getPhotoContentType() == null) {
            throw new ResourceNotFoundException("Photo for item with id " + id + " was not found");
        }
        return new ItemPhoto(photoStorageService.load(item.getPhotoFilename()),
                org.springframework.http.MediaType.parseMediaType(item.getPhotoContentType()));
    }

    @Transactional
    public void deletePhoto(Long id) {
        Item item = getEntity(id);
        String filename = item.getPhotoFilename();
        if (filename == null) {
            return;
        }
        item.setPhotoFilename(null);
        item.setPhotoContentType(null);
        itemRepository.saveAndFlush(item);
        deletePhotoAfterCommit(filename);
    }

    private Item getEntity(Long id) {
        return itemRepository.findByIdAndHouseholdId(id, activeHousehold().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Item with id " + id + " was not found"));
    }

    private Set<Long> normalizedItemIds(BulkMoveItemsRequest request) {
        if (request == null || request.itemIds() == null || request.itemIds().isEmpty()) {
            throw new BadRequestException("Select at least one item to move");
        }
        if (request.roomId() == null || request.roomId() <= 0
                || request.storageLocationId() == null || request.storageLocationId() <= 0
                || request.itemIds().stream().anyMatch(id -> id == null || id <= 0)) {
            throw new BadRequestException("Item, room, and storage location IDs must be positive numbers");
        }
        return new LinkedHashSet<>(request.itemIds());
    }

    private void copy(Item item, String name, String description, Integer quantity, Long categoryId,
                      Long roomId, Long storageLocationId, java.math.BigDecimal value,
                      java.time.LocalDate purchaseDate, java.time.LocalDate warrantyDate,
                      com.example.homeinventory.entity.ItemCondition condition, String notes) {
        item.setName(name.trim());
        item.setHousehold(activeHousehold());
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

    private Household activeHousehold() {
        return householdAccessService.getActiveHousehold();
    }

    private StorageLocation resolveLocation(Long locationId, Long roomId) {
        StorageLocation location = storageLocationService.getEntity(locationId);
        if (!location.getRoom().getId().equals(roomId)) {
            throw new BadRequestException("The storage location does not belong to the selected room");
        }
        return location;
    }

    private void finishPhotoReplacement(String newFilename, String previousFilename) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            photoStorageService.delete(previousFilename);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deletePhotoQuietly(previousFilename);
            }

            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    deletePhotoQuietly(newFilename);
                }
            }
        });
    }

    private void deletePhotoAfterCommit(String filename) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            photoStorageService.delete(filename);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deletePhotoQuietly(filename);
            }
        });
    }

    private void deletePhotoQuietly(String filename) {
        try {
            photoStorageService.delete(filename);
        } catch (RuntimeException ex) {
            log.error("Could not clean up stored item photo {}", filename, ex);
        }
    }

    // Manual mapping keeps persistence details out of the HTTP response and avoids circular JSON.
    private ItemResponse toResponse(Item item) {
        StorageLocation location = item.getStorageLocation();
        return new ItemResponse(item.getId(), item.getName(), item.getDescription(), item.getQuantity(),
                item.getCategory().getId(), item.getCategory().getName(), item.getCategory().getColor(),
                item.getRoom().getId(), item.getRoom().getName(),
                location.getId(), location.getName(),
                item.getEstimatedValue(), item.getPurchaseDate(), item.getWarrantyExpirationDate(),
                item.getCondition(), item.getNotes(), item.getPhotoFilename() == null || item.getPhotoContentType() == null
                        ? null : "items/" + item.getId() + "/photo",
                item.getCreatedAt(), item.getUpdatedAt());
    }
}
