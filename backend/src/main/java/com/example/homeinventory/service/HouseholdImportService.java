package com.example.homeinventory.service;

import com.example.homeinventory.dto.HouseholdExportResponse;
import com.example.homeinventory.dto.HouseholdExportResponse.CategoryData;
import com.example.homeinventory.dto.HouseholdExportResponse.ItemData;
import com.example.homeinventory.dto.HouseholdExportResponse.RoomData;
import com.example.homeinventory.dto.HouseholdExportResponse.StorageLocationData;
import com.example.homeinventory.dto.HouseholdImportPreviewResponse;
import com.example.homeinventory.dto.HouseholdImportPreviewResponse.ImportIssue;
import com.example.homeinventory.dto.HouseholdImportResultResponse;
import com.example.homeinventory.entity.Category;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.HouseholdMembership;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.entity.StorageLocation;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.repository.CategoryRepository;
import com.example.homeinventory.repository.ItemRepository;
import com.example.homeinventory.repository.RoomRepository;
import com.example.homeinventory.repository.StorageLocationRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional(readOnly = true)
public class HouseholdImportService {
    private static final String EXPORT_FORMAT = "nestled-household-export";
    private static final int EXPORT_VERSION = 1;
    private static final int MAX_ISSUES = 50;
    private static final long MAX_IMPORT_FILE_SIZE = 6L * 1024L * 1024L;
    private static final int MAX_ROOMS = 200;
    private static final int MAX_STORAGE_LOCATIONS = 1000;
    private static final int MAX_CATEGORIES = 200;
    private static final int MAX_ITEMS = 5000;
    private static final int MAX_MOVEMENT_HISTORY = 10000;
    private static final Pattern COLOR_PATTERN = Pattern.compile("^#[0-9A-Fa-f]{6}$");

    private final HouseholdAccessService householdAccessService;
    private final RoomRepository roomRepository;
    private final StorageLocationRepository storageLocationRepository;
    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;
    private final ObjectMapper objectMapper;

    public HouseholdImportService(HouseholdAccessService householdAccessService,
                                  RoomRepository roomRepository,
                                  StorageLocationRepository storageLocationRepository,
                                  CategoryRepository categoryRepository,
                                  ItemRepository itemRepository,
                                  ObjectMapper objectMapper) {
        this.householdAccessService = householdAccessService;
        this.roomRepository = roomRepository;
        this.storageLocationRepository = storageLocationRepository;
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.objectMapper = objectMapper;
    }

    public HouseholdImportPreviewResponse preview(MultipartFile file) {
        Household household = ownerHousehold();
        return analyze(household, parse(file)).toResponse(household);
    }

    @Transactional
    public HouseholdImportResultResponse importData(MultipartFile file) {
        Household household = ownerHousehold();
        HouseholdExportResponse source = parse(file);
        ImportAnalysis analysis = analyze(household, source);
        if (!analysis.errors().isEmpty()) {
            throw new BadRequestException("Resolve the errors in the import preview before importing");
        }

        Map<String, Room> rooms = entitiesByName(roomRepository.findByHouseholdIdOrderByNameAsc(household.getId()), Room::getName);
        long roomsCreated = 0;
        for (RoomData data : source.rooms()) {
            String key = normalized(data.name());
            if (!rooms.containsKey(key)) {
                Room room = new Room();
                room.setName(data.name().trim());
                room.setDescription(data.description());
                room.setColor(data.color());
                room.setHousehold(household);
                rooms.put(key, roomRepository.save(room));
                roomsCreated++;
            }
        }

        Map<String, Category> categories = entitiesByName(
                categoryRepository.findByHouseholdIdOrderByNameAsc(household.getId()), Category::getName);
        long categoriesCreated = 0;
        for (CategoryData data : source.categories()) {
            String key = normalized(data.name());
            if (!categories.containsKey(key)) {
                Category category = new Category();
                category.setName(data.name().trim());
                category.setColor(data.color());
                category.setHousehold(household);
                categories.put(key, categoryRepository.save(category));
                categoriesCreated++;
            }
        }

        Map<String, StorageLocation> locations = locationMap(
                storageLocationRepository.findByHouseholdIdOrderByNameAsc(household.getId()));
        long locationsCreated = 0;
        for (StorageLocationData data : source.storageLocations()) {
            String key = locationKey(data.roomName(), data.name());
            if (!locations.containsKey(key)) {
                StorageLocation location = new StorageLocation();
                location.setName(data.name().trim());
                location.setDescription(data.description());
                location.setColor(data.color());
                location.setRoom(rooms.get(normalized(data.roomName())));
                location.setHousehold(household);
                locations.put(key, storageLocationRepository.save(location));
                locationsCreated++;
            }
        }

        for (ItemData data : source.items()) {
            Item item = new Item();
            item.setName(data.name().trim());
            item.setDescription(data.description());
            item.setQuantity(data.quantity());
            item.setCategory(categories.get(normalized(data.categoryName())));
            item.setRoom(rooms.get(normalized(data.roomName())));
            item.setStorageLocation(locations.get(locationKey(data.roomName(), data.storageLocationName())));
            item.setHousehold(household);
            item.setEstimatedValue(data.estimatedValue());
            item.setPurchaseDate(data.purchaseDate());
            item.setWarrantyExpirationDate(data.warrantyExpirationDate());
            item.setCondition(data.condition());
            item.setNotes(data.notes());
            itemRepository.save(item);
        }

        return new HouseholdImportResultResponse(source.household().name(), household.getName(), roomsCreated,
                locationsCreated, categoriesCreated, source.items().size(), analysis.duplicateItems(),
                source.movementHistory().size());
    }

    private ImportAnalysis analyze(Household household, HouseholdExportResponse source) {
        List<ImportIssue> errors = new ArrayList<>();
        List<ImportIssue> warnings = new ArrayList<>();
        if (source == null) {
            addIssue(errors, "file", "The file is empty or does not contain a JSON object");
            return new ImportAnalysis(null, 0, 0, 0, 0, 0, 0, 0, errors, warnings);
        }
        if (!EXPORT_FORMAT.equals(source.format())) {
            addIssue(errors, "format", "This is not a Nestled household export file");
        }
        if (source.version() != EXPORT_VERSION) {
            addIssue(errors, "version", "This export version is not supported");
        }
        if (source.household() == null || blank(source.household().name())) {
            addIssue(errors, "household.name", "The source household name is required");
        }
        if (source.rooms() == null) addIssue(errors, "rooms", "The rooms list is required");
        if (source.storageLocations() == null) addIssue(errors, "storageLocations", "The storage locations list is required");
        if (source.categories() == null) addIssue(errors, "categories", "The categories list is required");
        if (source.items() == null) addIssue(errors, "items", "The items list is required");
        if (source.movementHistory() == null) addIssue(errors, "movementHistory", "The movement history list is required");
        validateListSize(source.rooms(), MAX_ROOMS, "rooms", errors);
        validateListSize(source.storageLocations(), MAX_STORAGE_LOCATIONS, "storageLocations", errors);
        validateListSize(source.categories(), MAX_CATEGORIES, "categories", errors);
        validateListSize(source.items(), MAX_ITEMS, "items", errors);
        validateListSize(source.movementHistory(), MAX_MOVEMENT_HISTORY, "movementHistory", errors);
        if (!errors.isEmpty()) {
            return new ImportAnalysis(source, 0, 0, 0, 0, 0, 0, 0, errors, warnings);
        }

        Map<String, Room> existingRooms = entitiesByName(
                roomRepository.findByHouseholdIdOrderByNameAsc(household.getId()), Room::getName);
        Map<String, Category> existingCategories = entitiesByName(
                categoryRepository.findByHouseholdIdOrderByNameAsc(household.getId()), Category::getName);
        Map<String, StorageLocation> existingLocations = locationMap(
                storageLocationRepository.findByHouseholdIdOrderByNameAsc(household.getId()));

        Map<String, RoomData> sourceRooms = validateRooms(source.rooms(), errors);
        Map<String, CategoryData> sourceCategories = validateCategories(source.categories(), errors);
        Map<String, StorageLocationData> sourceLocations = validateLocations(source.storageLocations(),
                sourceRooms, existingRooms, errors);
        validateItems(source.items(), sourceRooms, existingRooms, sourceCategories, existingCategories,
                sourceLocations, existingLocations, errors);

        long roomsToCreate = sourceRooms.keySet().stream().filter(key -> !existingRooms.containsKey(key)).count();
        long existingRoomCount = sourceRooms.keySet().stream().filter(existingRooms::containsKey).count();
        long locationsToCreate = sourceLocations.keySet().stream().filter(key -> !existingLocations.containsKey(key)).count();
        long existingLocationCount = sourceLocations.keySet().stream().filter(existingLocations::containsKey).count();
        long categoriesToCreate = sourceCategories.keySet().stream().filter(key -> !existingCategories.containsKey(key)).count();
        long existingCategoryCount = sourceCategories.keySet().stream().filter(existingCategories::containsKey).count();
        Set<String> availableRooms = new HashSet<>(existingRooms.keySet());
        availableRooms.addAll(sourceRooms.keySet());
        Set<String> availableCategories = new HashSet<>(existingCategories.keySet());
        availableCategories.addAll(sourceCategories.keySet());
        Set<String> availableLocations = new HashSet<>(existingLocations.keySet());
        availableLocations.addAll(sourceLocations.keySet());
        long duplicateItems = duplicateItemCount(source.items(), availableRooms, availableCategories,
                availableLocations, household.getId());
        if (duplicateItems > 0) {
            addIssue(warnings, "items", duplicateItems + " item(s) match existing items and will be imported as new records");
        }
        if (!source.movementHistory().isEmpty()) {
            addIssue(warnings, "movementHistory", "Movement history is not imported; only current inventory data will be added");
        }
        addIssue(warnings, "photos", "Photo files are not included in the export and cannot be imported");

        return new ImportAnalysis(source, roomsToCreate, existingRoomCount, locationsToCreate, existingLocationCount,
                categoriesToCreate, existingCategoryCount, duplicateItems, errors, warnings);
    }

    private Map<String, RoomData> validateRooms(List<RoomData> source, List<ImportIssue> errors) {
        Map<String, RoomData> result = new HashMap<>();
        for (int index = 0; index < source.size(); index++) {
            RoomData data = source.get(index);
            String path = "rooms[" + index + "]";
            if (data == null || blank(data.name())) {
                addIssue(errors, path + ".name", "Room name is required");
                continue;
            }
            if (data.name().trim().length() > 100) addIssue(errors, path + ".name", "Room name is too long");
            validateDescriptionAndColor(data.description(), data.color(), path, 500, errors);
            String key = normalized(data.name());
            if (result.putIfAbsent(key, data) != null) {
                addIssue(errors, path + ".name", "Duplicate room name");
            }
        }
        return result;
    }

    private Map<String, CategoryData> validateCategories(List<CategoryData> source, List<ImportIssue> errors) {
        Map<String, CategoryData> result = new HashMap<>();
        for (int index = 0; index < source.size(); index++) {
            CategoryData data = source.get(index);
            String path = "categories[" + index + "]";
            if (data == null || blank(data.name())) {
                addIssue(errors, path + ".name", "Category name is required");
                continue;
            }
            if (data.name().trim().length() > 100) addIssue(errors, path + ".name", "Category name is too long");
            validateColor(data.color(), path + ".color", errors);
            String key = normalized(data.name());
            if (result.putIfAbsent(key, data) != null) addIssue(errors, path + ".name", "Duplicate category name");
        }
        return result;
    }

    private Map<String, StorageLocationData> validateLocations(List<StorageLocationData> source,
                                                                Map<String, RoomData> sourceRooms,
                                                                Map<String, Room> existingRooms,
                                                                List<ImportIssue> errors) {
        Map<String, StorageLocationData> result = new HashMap<>();
        for (int index = 0; index < source.size(); index++) {
            StorageLocationData data = source.get(index);
            String path = "storageLocations[" + index + "]";
            if (data == null || blank(data.name())) {
                addIssue(errors, path + ".name", "Storage location name is required");
                continue;
            }
            if (data.name().trim().length() > 100) addIssue(errors, path + ".name", "Storage location name is too long");
            if (blank(data.roomName())) {
                addIssue(errors, path + ".roomName", "Room name is required");
                continue;
            }
            if (data.roomName().trim().length() > 100) addIssue(errors, path + ".roomName", "Room name is too long");
            validateDescriptionAndColor(data.description(), data.color(), path, 500, errors);
            String roomKey = normalized(data.roomName());
            if (!sourceRooms.containsKey(roomKey) && !existingRooms.containsKey(roomKey)) {
                addIssue(errors, path + ".roomName", "The referenced room does not exist");
                continue;
            }
            String key = locationKey(data.roomName(), data.name());
            if (result.putIfAbsent(key, data) != null) addIssue(errors, path + ".name", "Duplicate storage location in this room");
        }
        return result;
    }

    private void validateItems(List<ItemData> source,
                               Map<String, RoomData> sourceRooms,
                               Map<String, Room> existingRooms,
                               Map<String, CategoryData> sourceCategories,
                               Map<String, Category> existingCategories,
                               Map<String, StorageLocationData> sourceLocations,
                               Map<String, StorageLocation> existingLocations,
                               List<ImportIssue> errors) {
        for (int index = 0; index < source.size(); index++) {
            ItemData data = source.get(index);
            String path = "items[" + index + "]";
            if (data == null) {
                addIssue(errors, path, "Item is required");
                continue;
            }
            if (blank(data.name())) addIssue(errors, path + ".name", "Item name is required");
            else if (data.name().trim().length() > 150) addIssue(errors, path + ".name", "Item name is too long");
            if (data.description() != null && data.description().length() > 1000) addIssue(errors, path + ".description", "Description is too long");
            if (data.quantity() == null || data.quantity() < 1) addIssue(errors, path + ".quantity", "Quantity must be at least 1");
            if (data.estimatedValue() != null && data.estimatedValue().compareTo(BigDecimal.ZERO) < 0) addIssue(errors, path + ".estimatedValue", "Estimated value cannot be negative");
            if (data.condition() == null) addIssue(errors, path + ".condition", "Condition is required");
            if (data.notes() != null && data.notes().length() > 2000) addIssue(errors, path + ".notes", "Notes are too long");
            if (data.purchaseDate() != null && data.warrantyExpirationDate() != null
                    && data.warrantyExpirationDate().isBefore(data.purchaseDate())) {
                addIssue(errors, path + ".warrantyExpirationDate", "Warranty expiration cannot be before purchase date");
            }

            String roomKey = normalized(data.roomName());
            String categoryKey = normalized(data.categoryName());
            String locationKey = locationKey(data.roomName(), data.storageLocationName());
            if (blank(data.roomName()) || (!sourceRooms.containsKey(roomKey) && !existingRooms.containsKey(roomKey))) {
                addIssue(errors, path + ".roomName", "The referenced room does not exist");
            }
            if (blank(data.categoryName()) || (!sourceCategories.containsKey(categoryKey) && !existingCategories.containsKey(categoryKey))) {
                addIssue(errors, path + ".categoryName", "The referenced category does not exist");
            }
            if (blank(data.storageLocationName()) || (!sourceLocations.containsKey(locationKey) && !existingLocations.containsKey(locationKey))) {
                addIssue(errors, path + ".storageLocationName", "The referenced storage location does not exist in the selected room");
            }
        }
    }

    private long duplicateItemCount(List<ItemData> source, Set<String> rooms,
                                    Set<String> categories, Set<String> locations,
                                    Long householdId) {
        Set<String> existingKeys = itemRepository.findByHouseholdIdOrderByNameAsc(householdId).stream()
                .map(item -> itemKey(item.getName(), item.getCategory().getName(), item.getRoom().getName(),
                        item.getStorageLocation() == null ? null : item.getStorageLocation().getName()))
                .collect(Collectors.toSet());
        Set<String> seen = new HashSet<>();
        long duplicates = 0;
        for (ItemData data : source) {
            if (data == null || blank(data.name()) || blank(data.categoryName()) || blank(data.roomName())
                    || blank(data.storageLocationName()) || !rooms.contains(normalized(data.roomName()))
                    || !categories.contains(normalized(data.categoryName()))
                    || !locations.contains(locationKey(data.roomName(), data.storageLocationName()))) continue;
            String key = itemKey(data.name(), data.categoryName(), data.roomName(), data.storageLocationName());
            if (existingKeys.contains(key) || !seen.add(key)) duplicates++;
        }
        return duplicates;
    }

    private HouseholdExportResponse parse(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new BadRequestException("Choose a JSON export file to import");
        if (file.getSize() > MAX_IMPORT_FILE_SIZE) {
            throw new BadRequestException("Import file must be 6 MB or smaller");
        }
        try (InputStream input = file.getInputStream()) {
            return objectMapper.readValue(input, HouseholdExportResponse.class);
        } catch (JsonProcessingException exception) {
            throw new BadRequestException("The import file is not valid Nestled JSON");
        } catch (IOException exception) {
            throw new BadRequestException("The import file could not be read");
        }
    }

    private void validateListSize(List<?> values, int maximum, String path, List<ImportIssue> errors) {
        if (values != null && values.size() > maximum) {
            addIssue(errors, path, "The " + path + " list cannot contain more than " + maximum + " records");
        }
    }

    private Household ownerHousehold() {
        HouseholdMembership membership = householdAccessService.getActiveMembership();
        if (membership.getRole() != HouseholdRole.OWNER) {
            throw new AccessDeniedException("Only the household owner can import household data");
        }
        return membership.getHousehold();
    }

    private void validateDescriptionAndColor(String description, String color, String path, int maxLength,
                                             List<ImportIssue> errors) {
        if (description != null && description.length() > maxLength) addIssue(errors, path + ".description", "Description is too long");
        validateColor(color, path + ".color", errors);
    }

    private void validateColor(String color, String path, List<ImportIssue> errors) {
        if (color != null && !COLOR_PATTERN.matcher(color).matches()) addIssue(errors, path, "Color must be a six-digit hex value");
    }

    private <T> Map<String, T> entitiesByName(List<T> entities, Function<T, String> nameGetter) {
        return entities.stream().collect(Collectors.toMap(entity -> normalized(nameGetter.apply(entity)), Function.identity(), (first, ignored) -> first));
    }

    private Map<String, StorageLocation> locationMap(List<StorageLocation> locations) {
        Map<String, StorageLocation> result = new HashMap<>();
        for (StorageLocation location : locations) {
            result.putIfAbsent(locationKey(location.getRoom().getName(), location.getName()), location);
        }
        return result;
    }

    private String itemKey(String name, String category, String room, String location) {
        return String.join("\u001F", normalized(name), normalized(category), normalized(room), normalized(location));
    }

    private String locationKey(String room, String location) {
        return normalized(room) + "\u001F" + normalized(location);
    }

    private String normalized(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private void addIssue(List<ImportIssue> issues, String path, String message) {
        if (issues.size() < MAX_ISSUES) issues.add(new ImportIssue(path, message));
    }

    private record ImportAnalysis(
            HouseholdExportResponse source,
            long roomsToCreate,
            long existingRooms,
            long locationsToCreate,
            long existingLocations,
            long categoriesToCreate,
            long existingCategories,
            long duplicateItems,
            List<ImportIssue> errors,
            List<ImportIssue> warnings
    ) {
        HouseholdImportPreviewResponse toResponse(Household household) {
            return new HouseholdImportPreviewResponse(source == null || source.household() == null
                    ? null : source.household().name(), source == null ? 0 : source.version(), household.getName(),
                    roomsToCreate, existingRooms, locationsToCreate, existingLocations, categoriesToCreate,
                    existingCategories, source == null || source.items() == null ? 0 : source.items().size(),
                    duplicateItems, source == null || source.movementHistory() == null ? 0 : source.movementHistory().size(),
                    errors, warnings, errors.isEmpty());
        }
    }
}
