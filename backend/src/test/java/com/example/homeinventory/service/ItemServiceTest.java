package com.example.homeinventory.service;

import com.example.homeinventory.dto.CreateItemRequest;
import com.example.homeinventory.entity.Category;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.entity.ItemCondition;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.entity.StorageLocation;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.repository.ItemRepository;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

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

        when(rooms.getEntity(1L)).thenReturn(room);
        when(categories.getEntity(1L)).thenReturn(category);
        when(items.save(any(Item.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(new CreateItemRequest("Passport", null, 1, 1L, 1L,
                null, null, null, null, ItemCondition.GOOD, null));

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
}
