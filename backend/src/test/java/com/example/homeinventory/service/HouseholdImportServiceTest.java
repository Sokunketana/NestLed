package com.example.homeinventory.service;

import com.example.homeinventory.dto.HouseholdExportResponse;
import com.example.homeinventory.entity.Category;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.HouseholdMembership;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.entity.ItemCondition;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.entity.StorageLocation;
import com.example.homeinventory.repository.CategoryRepository;
import com.example.homeinventory.repository.ItemRepository;
import com.example.homeinventory.repository.RoomRepository;
import com.example.homeinventory.repository.StorageLocationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HouseholdImportServiceTest {
    @Test
    void previewsStructureAndSkipsMovementHistoryWithoutWriting() throws Exception {
        Fixture fixture = new Fixture();

        var preview = fixture.service.preview(fixture.file(fixture.export(2)));

        assertEquals("Source home", preview.sourceHouseholdName());
        assertEquals("Destination home", preview.destinationHouseholdName());
        assertEquals(1, preview.roomsToCreate());
        assertEquals(1, preview.locationsToCreate());
        assertEquals(1, preview.categoriesToCreate());
        assertEquals(2, preview.itemsToImport());
        assertEquals(1, preview.duplicateItems());
        assertEquals(1, preview.movementRecordsSkipped());
        assertTrue(preview.canImport());
        assertTrue(preview.warnings().stream().anyMatch(issue -> issue.path().equals("movementHistory")));
        verify(fixture.items, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void reportsInvalidReferencesAndDoesNotAllowImport() throws Exception {
        Fixture fixture = new Fixture();
        HouseholdExportResponse source = fixture.export(1);
        source = new HouseholdExportResponse(source.format(), source.version(), source.exportedAt(), source.household(),
                source.rooms(), source.storageLocations(), List.of(), source.items(), source.movementHistory());

        var preview = fixture.service.preview(fixture.file(source));

        assertFalse(preview.canImport());
        assertTrue(preview.errors().stream().anyMatch(issue -> issue.path().equals("items[0].categoryName")));
    }

    @Test
    void importsNewStructureAndItemsWithoutOverwritingExistingData() throws Exception {
        Fixture fixture = new Fixture();
        var result = fixture.service.importData(fixture.file(fixture.export(1)));

        assertEquals(1, result.roomsCreated());
        assertEquals(1, result.locationsCreated());
        assertEquals(1, result.categoriesCreated());
        assertEquals(1, result.itemsImported());
        assertEquals(0, result.movementRecordsSkipped());
        verify(fixture.rooms).save(any(Room.class));
        verify(fixture.locations).save(any(StorageLocation.class));
        verify(fixture.categories).save(any(Category.class));
        verify(fixture.items).save(any(Item.class));
    }

    @Test
    void preventsMembersFromImportingTheWholeHousehold() throws Exception {
        Fixture fixture = new Fixture();
        when(fixture.membership.getRole()).thenReturn(HouseholdRole.MEMBER);

        assertThrows(AccessDeniedException.class, () -> fixture.service.preview(fixture.file(fixture.export(1))));
    }

    private static class Fixture {
        final HouseholdAccessService access = mock(HouseholdAccessService.class);
        final RoomRepository rooms = mock(RoomRepository.class);
        final StorageLocationRepository locations = mock(StorageLocationRepository.class);
        final CategoryRepository categories = mock(CategoryRepository.class);
        final ItemRepository items = mock(ItemRepository.class);
        final Household household = household(20L, "Destination home");
        final HouseholdMembership membership = mock(HouseholdMembership.class);
        final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
        final HouseholdImportService service = new HouseholdImportService(
                access, rooms, locations, categories, items, mapper);

        Fixture() {
            when(access.getActiveMembership()).thenReturn(membership);
            when(membership.getRole()).thenReturn(HouseholdRole.OWNER);
            when(membership.getHousehold()).thenReturn(household);
            when(rooms.findByHouseholdIdOrderByNameAsc(20L)).thenReturn(List.of());
            when(locations.findByHouseholdIdOrderByNameAsc(20L)).thenReturn(List.of());
            when(categories.findByHouseholdIdOrderByNameAsc(20L)).thenReturn(List.of());
            when(items.findByHouseholdIdOrderByNameAsc(20L)).thenReturn(List.of());
            when(rooms.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(locations.save(any(StorageLocation.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(categories.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(items.save(any(Item.class))).thenAnswer(invocation -> invocation.getArgument(0));
        }

        HouseholdExportResponse export(int itemCount) {
            var item = new HouseholdExportResponse.ItemData("Passport", "Travel document", 1, "Documents",
                    "Bedroom", "Top drawer", new BigDecimal("25.00"), LocalDate.of(2026, 1, 10), null,
                    ItemCondition.GOOD, "Keep safe", false, null, null);
            var second = new HouseholdExportResponse.ItemData("Passport", "Another copy", 1, "Documents",
                    "Bedroom", "Top drawer", new BigDecimal("10.00"), null, null, ItemCondition.GOOD,
                    null, false, null, null);
            return new HouseholdExportResponse("nestled-household-export", 1, null,
                    new HouseholdExportResponse.HouseholdData("Source home"),
                    List.of(new HouseholdExportResponse.RoomData("Bedroom", "Main bedroom", "#D96F55")),
                    List.of(new HouseholdExportResponse.StorageLocationData("Top drawer", "Documents", "#D8A52B", "Bedroom")),
                    List.of(new HouseholdExportResponse.CategoryData("Documents", "#145247")),
                    itemCount == 2 ? List.of(item, second) : List.of(item),
                    itemCount == 2 ? List.of(new HouseholdExportResponse.MovementData("Passport", "Bedroom", "Top drawer",
                            "Bedroom", "Top drawer", null)) : List.of());
        }

        MockMultipartFile file(HouseholdExportResponse source) throws Exception {
            return new MockMultipartFile("file", "backup.json", MediaType.APPLICATION_JSON_VALUE,
                    mapper.writeValueAsString(source).getBytes(StandardCharsets.UTF_8));
        }
    }

    private static Household household(Long id, String name) {
        Household household = new Household(name);
        ReflectionTestUtils.setField(household, "id", id);
        return household;
    }
}
