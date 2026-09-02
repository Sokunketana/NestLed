package com.example.homeinventory.service;

import com.example.homeinventory.dto.RoomRequest;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.exception.ResourceNotFoundException;
import com.example.homeinventory.repository.ItemRepository;
import com.example.homeinventory.repository.RoomRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
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

    private RoomService service(RoomRepository rooms, ItemRepository items, Household household) {
        HouseholdAccessService access = mock(HouseholdAccessService.class);
        when(access.getActiveHousehold()).thenReturn(household);
        return new RoomService(rooms, items, access);
    }

    private Household household() {
        Household household = new Household("My home");
        ReflectionTestUtils.setField(household, "id", 99L);
        return household;
    }
}
