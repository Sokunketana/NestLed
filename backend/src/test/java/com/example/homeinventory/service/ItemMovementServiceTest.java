package com.example.homeinventory.service;

import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.entity.ItemMovement;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.entity.StorageLocation;
import com.example.homeinventory.repository.ItemMovementRepository;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ItemMovementServiceTest {
    @Test
    void recordsLocationSnapshotsWhenAnItemMoves() {
        ItemMovementRepository movements = mock(ItemMovementRepository.class);
        ItemMovementService service = new ItemMovementService(movements, mock(HouseholdAccessService.class));
        Household household = mock(Household.class);
        Item item = item(42L, "Camera", household, room(2L, "Office"), location(20L, "Desk drawer"));
        Room previousRoom = room(1L, "Bedroom");
        StorageLocation previousLocation = location(10L, "Wardrobe");

        service.recordMove(item, previousRoom, previousLocation);

        ArgumentCaptor<ItemMovement> captor = ArgumentCaptor.forClass(ItemMovement.class);
        verify(movements).save(captor.capture());
        ItemMovement saved = captor.getValue();
        assertEquals(42L, saved.getItemId());
        assertEquals("Camera", saved.getItemName());
        assertEquals("Bedroom", saved.getFromRoomName());
        assertEquals("Wardrobe", saved.getFromLocationName());
        assertEquals("Office", saved.getToRoomName());
        assertEquals("Desk drawer", saved.getToLocationName());
        assertEquals(household, saved.getHousehold());
    }

    @Test
    void doesNotRecordAnEditThatKeepsTheSameLocation() {
        ItemMovementRepository movements = mock(ItemMovementRepository.class);
        ItemMovementService service = new ItemMovementService(movements, mock(HouseholdAccessService.class));
        Room room = room(1L, "Bedroom");
        StorageLocation location = location(10L, "Wardrobe");
        Item item = item(42L, "Camera", mock(Household.class), room, location);

        service.recordMove(item, room, location);

        verify(movements, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void listsOnlyTheActiveHouseholdsNewestMovements() {
        ItemMovementRepository movements = mock(ItemMovementRepository.class);
        HouseholdAccessService access = mock(HouseholdAccessService.class);
        Household household = mock(Household.class);
        when(household.getId()).thenReturn(99L);
        when(access.getActiveHousehold()).thenReturn(household);

        ItemMovement movement = new ItemMovement(
                item(42L, "Camera", household, room(2L, "Office"), location(20L, "Desk drawer")),
                room(1L, "Bedroom"), location(10L, "Wardrobe"));
        ReflectionTestUtils.setField(movement, "id", 7L);
        ReflectionTestUtils.setField(movement, "movedAt", Instant.parse("2026-09-02T08:30:00Z"));
        when(movements.findByHouseholdIdOrderByMovedAtDescIdDesc(99L)).thenReturn(List.of(movement));

        var response = new ItemMovementService(movements, access).findAll();

        assertEquals(1, response.size());
        assertEquals(7L, response.getFirst().id());
        assertEquals("Camera", response.getFirst().itemName());
        assertEquals(Instant.parse("2026-09-02T08:30:00Z"), response.getFirst().movedAt());
        verify(movements).findByHouseholdIdOrderByMovedAtDescIdDesc(99L);
    }

    private Item item(Long id, String name, Household household, Room room, StorageLocation location) {
        Item item = new Item();
        ReflectionTestUtils.setField(item, "id", id);
        item.setName(name);
        item.setHousehold(household);
        item.setRoom(room);
        item.setStorageLocation(location);
        return item;
    }

    private Room room(Long id, String name) {
        Room room = mock(Room.class);
        when(room.getId()).thenReturn(id);
        when(room.getName()).thenReturn(name);
        return room;
    }

    private StorageLocation location(Long id, String name) {
        StorageLocation location = mock(StorageLocation.class);
        when(location.getId()).thenReturn(id);
        when(location.getName()).thenReturn(name);
        return location;
    }
}
