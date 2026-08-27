package com.example.homeinventory.service;

import com.example.homeinventory.dto.CreateItemRequest;
import com.example.homeinventory.entity.Category;
import com.example.homeinventory.entity.ItemCondition;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.entity.StorageLocation;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.repository.ItemRepository;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class ItemServiceTest {
    @Test
    void createRejectsStorageLocationFromAnotherRoom() {
        ItemRepository items = mock(ItemRepository.class);
        RoomService rooms = mock(RoomService.class);
        CategoryService categories = mock(CategoryService.class);
        StorageLocationService locations = mock(StorageLocationService.class);
        ItemService service = new ItemService(items, rooms, categories, locations);

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
