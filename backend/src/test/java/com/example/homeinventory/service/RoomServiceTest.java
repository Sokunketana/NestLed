package com.example.homeinventory.service;

import com.example.homeinventory.dto.RoomRequest;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.ResourceNotFoundException;
import com.example.homeinventory.repository.ItemRepository;
import com.example.homeinventory.repository.RoomRepository;
import com.example.homeinventory.repository.StorageLocationRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RoomServiceTest {
    @Test
    void listsOnlyRoomsFromTheActiveHousehold() {
        RoomRepository rooms = mock(RoomRepository.class);
        ItemRepository items = mock(ItemRepository.class);
        Household household = household();
        Room room = new Room();
        room.setHousehold(household);
        room.setName("Kitchen");
        ReflectionTestUtils.setField(room, "id", 4L);
        when(rooms.findByHouseholdIdOrderByNameAsc(99L)).thenReturn(List.of(room));
        when(items.countByHouseholdIdAndRoomId(99L, 4L)).thenReturn(2L);

        var response = service(rooms, items, household).findAll();

        assertEquals(1, response.size());
        assertEquals("Kitchen", response.getFirst().name());
        verify(rooms).findByHouseholdIdOrderByNameAsc(99L);
    }

    @Test
    void anotherHouseholdsRoomLooksNotFound() {
        RoomRepository rooms = mock(RoomRepository.class);
        Household household = household();
        when(rooms.findByIdAndHouseholdId(42L, 99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service(rooms, mock(ItemRepository.class), household).findById(42L));
    }

    @Test
    void creatingRoomAssignsTheActiveHousehold() {
        RoomRepository rooms = mock(RoomRepository.class);
        Household household = household();
        when(rooms.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service(rooms, mock(ItemRepository.class), household)
                .create(new RoomRequest("Office", "Work area"));

        verify(rooms).save(org.mockito.ArgumentMatchers.argThat(room -> room.getHousehold() == household));
        verify(rooms).existsByHouseholdIdAndNameIgnoreCase(99L, "Office");
    }

    @Test
    void creatingRoomPersistsTheSelectedColor() {
        RoomRepository rooms = mock(RoomRepository.class);
        ItemRepository items = mock(ItemRepository.class);
        Household household = household();
        when(rooms.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service(rooms, items, household)
                .create(new RoomRequest("Office", "Work area", "#4f83cc"));

        verify(rooms).save(org.mockito.ArgumentMatchers.argThat(room -> "#4F83CC".equals(room.getColor())));
        assertEquals("#4F83CC", response.color());
    }

    @Test
    void deletingRoomWithItemsAndLocationsExplainsWhatMustBeClearedFirst() {
        RoomRepository rooms = mock(RoomRepository.class);
        ItemRepository items = mock(ItemRepository.class);
        StorageLocationRepository locations = mock(StorageLocationRepository.class);
        Household household = household();
        Room room = new Room();
        ReflectionTestUtils.setField(room, "id", 4L);
        when(rooms.findByIdAndHouseholdId(4L, 99L)).thenReturn(Optional.of(room));
        when(items.countByHouseholdIdAndRoomId(99L, 4L)).thenReturn(2L);
        when(locations.countByRoomIdAndHouseholdId(4L, 99L)).thenReturn(1L);

        var exception = assertThrows(BadRequestException.class,
                () -> service(rooms, items, locations, household).delete(4L));

        assertEquals("This room still has items and storage locations. Move or delete its items, "
                + "then delete its storage locations before deleting the room", exception.getMessage());
        verify(rooms, never()).delete(any());
    }

    private RoomService service(RoomRepository rooms, ItemRepository items, Household household) {
        return service(rooms, items, mock(StorageLocationRepository.class), household);
    }

    private RoomService service(RoomRepository rooms, ItemRepository items,
                                StorageLocationRepository locations, Household household) {
        HouseholdAccessService access = mock(HouseholdAccessService.class);
        when(access.getActiveHousehold()).thenReturn(household);
        return new RoomService(rooms, items, locations, access);
    }

    private Household household() {
        Household household = new Household("My home");
        ReflectionTestUtils.setField(household, "id", 99L);
        return household;
    }
}
