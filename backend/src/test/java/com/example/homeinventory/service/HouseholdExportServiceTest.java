package com.example.homeinventory.service;

import com.example.homeinventory.entity.Category;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.HouseholdMembership;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.entity.ItemCondition;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.entity.StorageLocation;
import com.example.homeinventory.repository.CategoryRepository;
import com.example.homeinventory.repository.ItemMovementRepository;
import com.example.homeinventory.repository.ItemRepository;
import com.example.homeinventory.repository.RoomRepository;
import com.example.homeinventory.repository.StorageLocationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HouseholdExportServiceTest {
    @Test
    void exportsPortableJsonWithHouseholdDataButWithoutDatabaseIds() {
        Fixture fixture = new Fixture();
        Item item = fixture.item();
        when(fixture.items.findByHouseholdIdOrderByNameAsc(10L)).thenReturn(List.of(item));

        String json = new String(fixture.service.export("json").content(), StandardCharsets.UTF_8);

        assertTrue(json.contains("nestled-household-export"));
        assertTrue(json.contains("Our home"));
        assertTrue(json.contains("Passport"));
        assertFalse(json.contains("\"id\""));
    }

    @Test
    void exportsCsvWithAnItemHeaderAndEscapedFormulaLikeText() {
        Fixture fixture = new Fixture();
        Item item = fixture.item();
        item.setName("=Potential formula");
        when(fixture.items.findByHouseholdIdOrderByNameAsc(10L)).thenReturn(List.of(item));

        String csv = new String(fixture.service.export("csv").content(), StandardCharsets.UTF_8);

        assertTrue(csv.startsWith("\uFEFF\"name\",\"description\""));
        assertTrue(csv.contains("\"'=Potential formula\""));
    }

    @Test
    void preventsMembersFromExportingTheWholeHousehold() {
        Fixture fixture = new Fixture();
        when(fixture.membership.getRole()).thenReturn(HouseholdRole.MEMBER);

        assertThrows(AccessDeniedException.class, () -> fixture.service.export("json"));
    }

    @Test
    void previewsCountsAndFormatSpecificContentsBeforeExport() {
        Fixture fixture = new Fixture();
        when(fixture.rooms.countByHouseholdId(10L)).thenReturn(2L);
        when(fixture.locations.countByHouseholdId(10L)).thenReturn(4L);
        when(fixture.categories.countByHouseholdId(10L)).thenReturn(3L);
        when(fixture.items.countByHouseholdId(10L)).thenReturn(12L);
        when(fixture.items.countByHouseholdIdAndPhotoFilenameIsNotNull(10L)).thenReturn(5L);
        when(fixture.movements.countByHouseholdId(10L)).thenReturn(7L);

        var preview = fixture.service.preview("csv");

        assertTrue(preview.format().equals("csv"));
        assertTrue(preview.householdName().equals("Our home"));
        assertTrue(preview.roomCount() == 2L);
        assertTrue(preview.storageLocationCount() == 4L);
        assertTrue(preview.categoryCount() == 3L);
        assertTrue(preview.itemCount() == 12L);
        assertTrue(preview.movementCount() == 7L);
        assertTrue(preview.photoCount() == 5L);
        assertFalse(preview.movementHistoryIncluded());
    }

    private static class Fixture {
        final HouseholdAccessService access = mock(HouseholdAccessService.class);
        final RoomRepository rooms = mock(RoomRepository.class);
        final StorageLocationRepository locations = mock(StorageLocationRepository.class);
        final CategoryRepository categories = mock(CategoryRepository.class);
        final ItemRepository items = mock(ItemRepository.class);
        final ItemMovementRepository movements = mock(ItemMovementRepository.class);
        final Household household = household(10L, "Our home");
        final HouseholdMembership membership = mock(HouseholdMembership.class);
        final HouseholdExportService service = new HouseholdExportService(
                access, rooms, locations, categories, items, movements,
                new ObjectMapper().findAndRegisterModules());

        Fixture() {
            when(access.getActiveMembership()).thenReturn(membership);
            when(membership.getRole()).thenReturn(HouseholdRole.OWNER);
            when(membership.getHousehold()).thenReturn(household);
            when(rooms.findByHouseholdIdOrderByNameAsc(10L)).thenReturn(List.of());
            when(locations.findByHouseholdIdOrderByNameAsc(10L)).thenReturn(List.of());
            when(categories.findByHouseholdIdOrderByNameAsc(10L)).thenReturn(List.of());
            when(movements.findByHouseholdIdOrderByMovedAtDescIdDesc(10L)).thenReturn(List.of());
        }

        Item item() {
            Room room = new Room();
            room.setName("Bedroom");
            room.setHousehold(household);
            StorageLocation location = new StorageLocation();
            location.setName("Top drawer");
            location.setRoom(room);
            location.setHousehold(household);
            Category category = new Category();
            category.setName("Documents");
            category.setHousehold(household);

            Item item = new Item();
            item.setName("Passport");
            item.setDescription("Travel document");
            item.setQuantity(1);
            item.setRoom(room);
            item.setStorageLocation(location);
            item.setCategory(category);
            item.setEstimatedValue(new BigDecimal("25.00"));
            item.setCondition(ItemCondition.GOOD);
            ReflectionTestUtils.setField(item, "createdAt", LocalDateTime.parse("2026-09-01T10:00:00"));
            ReflectionTestUtils.setField(item, "updatedAt", LocalDateTime.parse("2026-09-01T10:00:00"));
            return item;
        }
    }

    private static Household household(Long id, String name) {
        Household household = new Household(name);
        ReflectionTestUtils.setField(household, "id", id);
        return household;
    }
}
