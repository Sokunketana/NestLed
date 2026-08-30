package com.example.homeinventory.service;

import com.example.homeinventory.dto.CreateItemRequest;
import com.example.homeinventory.dto.BulkMoveItemsRequest;
import com.example.homeinventory.entity.Category;
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
import static org.mockito.Mockito.*;

class ItemServiceTest {
    @Test
    void createPreservesMissingEstimatedValue() {
        ItemRepository items = mock(ItemRepository.class);
        RoomService rooms = mock(RoomService.class);
        CategoryService categories = mock(CategoryService.class);
        StorageLocationService locations = mock(StorageLocationService.class);
        PhotoStorageService photos = mock(PhotoStorageService.class);
        ItemService service = new ItemService(items, rooms, categories, locations, photos);
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
        verify(items).save(argThat(item -> item.getEstimatedValue() == null));
    }

    @Test
    void createRejectsStorageLocationFromAnotherRoom() {
        ItemRepository items = mock(ItemRepository.class);
        RoomService rooms = mock(RoomService.class);
        CategoryService categories = mock(CategoryService.class);
        StorageLocationService locations = mock(StorageLocationService.class);
        PhotoStorageService photos = mock(PhotoStorageService.class);
        ItemService service = new ItemService(items, rooms, categories, locations, photos);

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
    void bulkMoveMovesEveryDistinctItemToTheDestination() {
        ItemRepository items = mock(ItemRepository.class);
        RoomService rooms = mock(RoomService.class);
        CategoryService categories = mock(CategoryService.class);
        StorageLocationService locations = mock(StorageLocationService.class);
        PhotoStorageService photos = mock(PhotoStorageService.class);
        ItemService service = new ItemService(items, rooms, categories, locations, photos);
        Room room = mock(Room.class);
        StorageLocation location = mock(StorageLocation.class);
        Item first = mock(Item.class);
        Item second = mock(Item.class);

        when(room.getId()).thenReturn(3L);
        when(room.getName()).thenReturn("Garage");
        when(location.getId()).thenReturn(30L);
        when(location.getName()).thenReturn("Blue storage box");
        when(location.getRoom()).thenReturn(room);
        when(first.getId()).thenReturn(1L);
        when(second.getId()).thenReturn(2L);
        when(rooms.getEntity(3L)).thenReturn(room);
        when(locations.getEntity(30L)).thenReturn(location);
        when(items.findAllById(any())).thenReturn(List.of(first, second));

        var response = service.bulkMove(new BulkMoveItemsRequest(List.of(1L, 1L, 2L), 3L, 30L));

        assertEquals(2, response.movedCount());
        assertEquals(3L, response.roomId());
        assertEquals("Garage", response.roomName());
        assertEquals(30L, response.storageLocationId());
        assertEquals("Blue storage box", response.storageLocationName());
        verify(first).setRoom(room);
        verify(first).setStorageLocation(location);
        verify(second).setRoom(room);
        verify(second).setStorageLocation(location);
        verify(items).saveAll(List.of(first, second));
        verify(items).findAllById(argThat(ids -> {
            List<Long> requestedIds = new java.util.ArrayList<>();
            ids.forEach(requestedIds::add);
            return requestedIds.equals(List.of(1L, 2L));
        }));
    }

    @Test
    void bulkMoveRejectsMissingItemsBeforeChangingAnyItem() {
        ItemRepository items = mock(ItemRepository.class);
        RoomService rooms = mock(RoomService.class);
        CategoryService categories = mock(CategoryService.class);
        StorageLocationService locations = mock(StorageLocationService.class);
        PhotoStorageService photos = mock(PhotoStorageService.class);
        ItemService service = new ItemService(items, rooms, categories, locations, photos);
        Room room = mock(Room.class);
        StorageLocation location = mock(StorageLocation.class);
        Item foundItem = mock(Item.class);

        when(room.getId()).thenReturn(3L);
        when(location.getRoom()).thenReturn(room);
        when(foundItem.getId()).thenReturn(1L);
        when(rooms.getEntity(3L)).thenReturn(room);
        when(locations.getEntity(30L)).thenReturn(location);
        when(items.findAllById(any())).thenReturn(List.of(foundItem));

        ResourceNotFoundException error = assertThrows(ResourceNotFoundException.class,
                () -> service.bulkMove(new BulkMoveItemsRequest(List.of(1L, 2L), 3L, 30L)));

        assertEquals("Items with ids [2] were not found", error.getMessage());
        verify(foundItem, never()).setRoom(any());
        verify(foundItem, never()).setStorageLocation(any());
        verify(items, never()).saveAll(any());
    }

    @Test
    void bulkMoveRejectsStorageLocationFromAnotherRoom() {
        ItemRepository items = mock(ItemRepository.class);
        RoomService rooms = mock(RoomService.class);
        CategoryService categories = mock(CategoryService.class);
        StorageLocationService locations = mock(StorageLocationService.class);
        PhotoStorageService photos = mock(PhotoStorageService.class);
        ItemService service = new ItemService(items, rooms, categories, locations, photos);
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

        verify(items, never()).findAllById(any());
        verify(items, never()).saveAll(any());
    }

    @Test
    void bulkMoveRejectsEmptySelectionWhenCalledDirectly() {
        ItemService service = new ItemService(mock(ItemRepository.class), mock(RoomService.class),
                mock(CategoryService.class), mock(StorageLocationService.class), mock(PhotoStorageService.class));

        assertThrows(BadRequestException.class,
                () -> service.bulkMove(new BulkMoveItemsRequest(List.of(), 3L, 30L)));
    }
}
