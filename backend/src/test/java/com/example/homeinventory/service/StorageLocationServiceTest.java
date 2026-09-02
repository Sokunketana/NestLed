package com.example.homeinventory.service;

import com.example.homeinventory.dto.StorageLocationRequest;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.StorageLocation;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.repository.ItemRepository;
import com.example.homeinventory.repository.StorageLocationRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class StorageLocationServiceTest {
    @Test
    void updateRejectsMovingPopulatedLocationToAnotherRoom() {
        StorageLocationRepository locations = mock(StorageLocationRepository.class);
        RoomService rooms = mock(RoomService.class);
        ItemRepository items = mock(ItemRepository.class);
        Household household = mock(Household.class);
        when(household.getId()).thenReturn(99L);
        HouseholdAccessService access = mock(HouseholdAccessService.class);
        when(access.getActiveHousehold()).thenReturn(household);
        StorageLocationService service = new StorageLocationService(locations, rooms, items, access);
        StorageLocation location = mock(StorageLocation.class);
        Room currentRoom = mock(Room.class);

        when(currentRoom.getId()).thenReturn(1L);
        when(location.getRoom()).thenReturn(currentRoom);
        when(locations.findByIdAndHouseholdId(10L, 99L)).thenReturn(Optional.of(location));
        when(items.countByHouseholdIdAndStorageLocationId(99L, 10L)).thenReturn(2L);

        var request = new StorageLocationRequest("Desk drawer", null, 2L);

        assertThrows(BadRequestException.class, () -> service.update(10L, request));
        verify(locations, never()).save(any());
        verifyNoInteractions(rooms);
    }
}
