package com.example.homeinventory.service;

import com.example.homeinventory.dto.BulkMoveItemsRequest;
import com.example.homeinventory.dto.CreateItemRequest;
import com.example.homeinventory.entity.Category;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.entity.ItemCondition;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.entity.StorageLocation;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.ResourceNotFoundException;
import com.example.homeinventory.repository.ItemRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ItemServiceTest {
    @Test
    void createPreservesMissingEstimatedValueAndAssignsTheActiveHousehold() {
        ItemRepository items = mock(ItemRepository.class);
        RoomService rooms = mock(RoomService.class);
        CategoryService categories = mock(CategoryService.class);
        StorageLocationService locations = mock(StorageLocationService.class);
        PhotoStorageService photos = mock(PhotoStorageService.class);
        Household household = household();
        ItemService service = service(items, rooms, categories, locations, photos, household);
        Room room = mock(Room.class);
        Category category = mock(Category.class);
        StorageLocation location = mock(StorageLocation.class);

        when(rooms.getEntity(1L)).thenReturn(room);
        when(categories.getEntity(1L)).thenReturn(category);
        when(locations.getEntity(10L)).thenReturn(location);
        when(location.getRoom()).thenReturn(room);
        when(room.getId()).thenReturn(1L);
        when(items.save(any(Item.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(new CreateItemRequest("Passport", null, 1, 1L, 1L,
                10L, null, null, null, ItemCondition.GOOD, null));

        assertNull(response.estimatedValue());
        assertNull(response.photoUrl());
        verify(items).save(argThat(item -> item.getEstimatedValue() == null
                && item.getHousehold() == household));
    }

    @Test
    void createRejectsStorageLocationFromAnotherRoom() {
        ItemRepository items = mock(ItemRepository.class);
        RoomService rooms = mock(RoomService.class);
        CategoryService categories = mock(CategoryService.class);
        StorageLocationService locations = mock(StorageLocationService.class);
        ItemService service = service(items, rooms, categories, locations,
                mock(PhotoStorageService.class), household());
        Room selectedRoom = mock(Room.class);
        Room differentRoom = mock(Room.class);
        StorageLocation location = mock(StorageLocation.class);
        when(selectedRoom.getId()).thenReturn(1L);
        when(differentRoom.getId()).thenReturn(2L);
        when(location.getRoom()).thenReturn(differentRoom);
        when(rooms.getEntity(1L)).thenReturn(selectedRoom);
        when(categories.getEntity(1L)).thenReturn(new Category());
        when(locations.getEntity(10L)).thenReturn(location);

        CreateItemRequest request = new CreateItemRequest("Passport", null, 1, 1L, 1L, 10L,
                BigDecimal.ZERO, null, null, ItemCondition.GOOD, null);

        assertThrows(BadRequestException.class, () -> service.create(request));
        verify(items, never()).save(any());
    }

    @Test
    void bulkMoveOnlyLoadsItemsFromTheActiveHousehold() {
        ItemRepository items = mock(ItemRepository.class);
        RoomService rooms = mock(RoomService.class);
        StorageLocationService locations = mock(StorageLocationService.class);
        ItemService service = service(items, rooms, mock(CategoryService.class), locations,
                mock(PhotoStorageService.class), household());
        Room room = mock(Room.class);
        StorageLocation location = mock(StorageLocation.class);
        Item first = mock(Item.class);
        Item second = mock(Item.class);
        when(room.getId()).thenReturn(3L);
        when(room.getName()).thenReturn("Garage");
        when(location.getId()).thenReturn(30L);
        when(location.getName()).thenReturn("Blue box");
        when(location.getRoom()).thenReturn(room);
        when(first.getId()).thenReturn(1L);
        when(second.getId()).thenReturn(2L);
        when(rooms.getEntity(3L)).thenReturn(room);
        when(locations.getEntity(30L)).thenReturn(location);
        when(items.findByIdInAndHouseholdId(any(), eq(99L))).thenReturn(List.of(first, second));

        var response = service.bulkMove(new BulkMoveItemsRequest(List.of(1L, 1L, 2L), 3L, 30L));

        assertEquals(2, response.movedCount());
        verify(items).findByIdInAndHouseholdId(argThat(ids -> ids.equals(java.util.Set.of(1L, 2L))), eq(99L));
        verify(first).setRoom(room);
        verify(second).setStorageLocation(location);
    }

    @Test
    void bulkMoveTreatsAnotherHouseholdsItemAsMissing() {
        ItemRepository items = mock(ItemRepository.class);
        RoomService rooms = mock(RoomService.class);
        StorageLocationService locations = mock(StorageLocationService.class);
        ItemService service = service(items, rooms, mock(CategoryService.class), locations,
                mock(PhotoStorageService.class), household());
        Room room = mock(Room.class);
        StorageLocation location = mock(StorageLocation.class);
        Item found = mock(Item.class);
        when(room.getId()).thenReturn(3L);
        when(location.getRoom()).thenReturn(room);
        when(found.getId()).thenReturn(1L);
        when(rooms.getEntity(3L)).thenReturn(room);
        when(locations.getEntity(30L)).thenReturn(location);
        when(items.findByIdInAndHouseholdId(any(), eq(99L))).thenReturn(List.of(found));

        ResourceNotFoundException error = assertThrows(ResourceNotFoundException.class,
                () -> service.bulkMove(new BulkMoveItemsRequest(List.of(1L, 2L), 3L, 30L)));

        assertEquals("Items with ids [2] were not found", error.getMessage());
        verify(found, never()).setRoom(any());
        verify(items, never()).saveAll(any());
    }

    @Test
    void bulkMoveRejectsStorageLocationFromAnotherRoomBeforeLoadingItems() {
        ItemRepository items = mock(ItemRepository.class);
        RoomService rooms = mock(RoomService.class);
        StorageLocationService locations = mock(StorageLocationService.class);
        ItemService service = service(items, rooms, mock(CategoryService.class), locations,
                mock(PhotoStorageService.class), household());
        Room selectedRoom = mock(Room.class);
        Room differentRoom = mock(Room.class);
        StorageLocation location = mock(StorageLocation.class);
        when(selectedRoom.getId()).thenReturn(3L);
        when(differentRoom.getId()).thenReturn(4L);
        when(location.getRoom()).thenReturn(differentRoom);
        when(rooms.getEntity(3L)).thenReturn(selectedRoom);
        when(locations.getEntity(30L)).thenReturn(location);

        assertThrows(BadRequestException.class,
                () -> service.bulkMove(new BulkMoveItemsRequest(List.of(1L), 3L, 30L)));
        verify(items, never()).findByIdInAndHouseholdId(any(), any());
    }

    @Test
    void findingAnItemUsesBothItsIdAndTheActiveHousehold() {
        ItemRepository items = mock(ItemRepository.class);
        ItemService service = service(items, mock(RoomService.class), mock(CategoryService.class),
                mock(StorageLocationService.class), mock(PhotoStorageService.class), household());
        when(items.findByIdAndHouseholdId(42L, 99L)).thenReturn(java.util.Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.findById(42L));
        verify(items).findByIdAndHouseholdId(42L, 99L);
    }

    @Test
    void bulkMoveRejectsEmptySelectionWhenCalledDirectly() {
        ItemService service = service(mock(ItemRepository.class), mock(RoomService.class),
                mock(CategoryService.class), mock(StorageLocationService.class),
                mock(PhotoStorageService.class), household());
        assertThrows(BadRequestException.class,
                () -> service.bulkMove(new BulkMoveItemsRequest(List.of(), 3L, 30L)));
    }

    private ItemService service(ItemRepository items, RoomService rooms, CategoryService categories,
                                StorageLocationService locations, PhotoStorageService photos,
                                Household household) {
        HouseholdAccessService access = mock(HouseholdAccessService.class);
        when(access.getActiveHousehold()).thenReturn(household);
        return new ItemService(items, rooms, categories, locations, photos, access);
    }

    private Household household() {
        Household household = mock(Household.class);
        when(household.getId()).thenReturn(99L);
        return household;
    }
}
