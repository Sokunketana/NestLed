package com.example.homeinventory.service;

import com.example.homeinventory.dto.HouseholdExportResponse;
import com.example.homeinventory.dto.HouseholdExportResponse.CategoryData;
import com.example.homeinventory.dto.HouseholdExportResponse.ItemData;
import com.example.homeinventory.dto.HouseholdExportResponse.MovementData;
import com.example.homeinventory.dto.HouseholdExportResponse.RoomData;
import com.example.homeinventory.dto.HouseholdExportResponse.StorageLocationData;
import com.example.homeinventory.dto.HouseholdExportPreviewResponse;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.HouseholdMembership;
import com.example.homeinventory.entity.HouseholdRole;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.entity.StorageLocation;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.repository.CategoryRepository;
import com.example.homeinventory.repository.ItemMovementRepository;
import com.example.homeinventory.repository.ItemRepository;
import com.example.homeinventory.repository.RoomRepository;
import com.example.homeinventory.repository.StorageLocationRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class HouseholdExportService {
    private static final String EXPORT_FORMAT = "nestled-household-export";
    private static final int EXPORT_VERSION = 1;
    private static final MediaType CSV_MEDIA_TYPE = MediaType.parseMediaType("text/csv;charset=UTF-8");

    private final HouseholdAccessService householdAccessService;
    private final RoomRepository roomRepository;
    private final StorageLocationRepository storageLocationRepository;
    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;
    private final ItemMovementRepository movementRepository;
    private final ObjectMapper objectMapper;

    public HouseholdExportService(HouseholdAccessService householdAccessService,
                                  RoomRepository roomRepository,
                                  StorageLocationRepository storageLocationRepository,
                                  CategoryRepository categoryRepository,
                                  ItemRepository itemRepository,
                                  ItemMovementRepository movementRepository,
                                  ObjectMapper objectMapper) {
        this.householdAccessService = householdAccessService;
        this.roomRepository = roomRepository;
        this.storageLocationRepository = storageLocationRepository;
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
        this.movementRepository = movementRepository;
        this.objectMapper = objectMapper;
    }

    public ExportFile export(String requestedFormat) {
        Household household = ownerHousehold();
        String format = normalizeFormat(requestedFormat);

        return switch (format) {
            case "json" -> jsonExport(household);
            case "csv" -> csvExport(household);
            default -> throw new BadRequestException("Export format must be json or csv");
        };
    }

    public HouseholdExportPreviewResponse preview(String requestedFormat) {
        Household household = ownerHousehold();
        String format = normalizeFormat(requestedFormat);
        Long householdId = household.getId();
        return new HouseholdExportPreviewResponse(format, household.getName(),
                roomRepository.countByHouseholdId(householdId),
                storageLocationRepository.countByHouseholdId(householdId),
                categoryRepository.countByHouseholdId(householdId),
                itemRepository.countByHouseholdId(householdId),
                movementRepository.countByHouseholdId(householdId),
                itemRepository.countByHouseholdIdAndPhotoFilenameIsNotNull(householdId),
                "json".equals(format));
    }

    private ExportFile jsonExport(Household household) {
        try {
            byte[] content = objectMapper.writeValueAsBytes(toResponse(household));
            return new ExportFile(content, MediaType.APPLICATION_JSON, filename(household, "json"));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not create household JSON export", exception);
        }
    }

    private ExportFile csvExport(Household household) {
        StringBuilder csv = new StringBuilder("\uFEFF");
        appendRow(csv, List.of(
                "name", "description", "quantity", "category", "room", "storage_location",
                "estimated_value", "purchase_date", "warranty_expiration_date", "condition",
                "notes", "photo_available", "created_at", "updated_at"));

        itemRepository.findByHouseholdIdOrderByNameAsc(household.getId())
                .forEach(item -> appendRow(csv, Arrays.asList(
                        item.getName(),
                        item.getDescription(),
                        item.getQuantity(),
                        item.getCategory().getName(),
                        item.getRoom().getName(),
                        item.getStorageLocation() == null ? null : item.getStorageLocation().getName(),
                        item.getEstimatedValue() == null ? null : item.getEstimatedValue().toPlainString(),
                        item.getPurchaseDate(),
                        item.getWarrantyExpirationDate(),
                        item.getCondition(),
                        item.getNotes(),
                        item.getPhotoFilename() == null ? "false" : "true",
                        item.getCreatedAt(),
                        item.getUpdatedAt())));

        return new ExportFile(csv.toString().getBytes(StandardCharsets.UTF_8), CSV_MEDIA_TYPE,
                filename(household, "csv"));
    }

    private HouseholdExportResponse toResponse(Household household) {
        Long householdId = household.getId();
        List<RoomData> rooms = roomRepository.findByHouseholdIdOrderByNameAsc(householdId).stream()
                .map(room -> new RoomData(room.getName(), room.getDescription(), room.getColor()))
                .toList();
        List<StorageLocationData> locations = storageLocationRepository.findByHouseholdIdOrderByNameAsc(householdId)
                .stream()
                .map(location -> new StorageLocationData(location.getName(), location.getDescription(),
                        location.getColor(), location.getRoom().getName()))
                .toList();
        List<CategoryData> categories = categoryRepository.findByHouseholdIdOrderByNameAsc(householdId).stream()
                .map(category -> new CategoryData(category.getName(), category.getColor()))
                .toList();
        List<ItemData> items = itemRepository.findByHouseholdIdOrderByNameAsc(householdId).stream()
                .map(this::toItemData)
                .toList();
        List<MovementData> movements = movementRepository.findByHouseholdIdOrderByMovedAtDescIdDesc(householdId)
                .stream()
                .map(movement -> new MovementData(movement.getItemName(), movement.getFromRoomName(),
                        movement.getFromLocationName(), movement.getToRoomName(), movement.getToLocationName(),
                        movement.getMovedAt()))
                .toList();

        return new HouseholdExportResponse(EXPORT_FORMAT, EXPORT_VERSION, Instant.now(),
                new HouseholdExportResponse.HouseholdData(household.getName()), rooms, locations,
                categories, items, movements);
    }

    private ItemData toItemData(Item item) {
        StorageLocation location = item.getStorageLocation();
        return new ItemData(item.getName(), item.getDescription(), item.getQuantity(), item.getCategory().getName(),
                item.getRoom().getName(), location == null ? null : location.getName(), item.getEstimatedValue(),
                item.getPurchaseDate(), item.getWarrantyExpirationDate(), item.getCondition(), item.getNotes(),
                item.getPhotoFilename() != null, item.getCreatedAt(), item.getUpdatedAt());
    }

    private Household ownerHousehold() {
        HouseholdMembership membership = householdAccessService.getActiveMembership();
        if (membership.getRole() != HouseholdRole.OWNER) {
            throw new AccessDeniedException("Only the household owner can export household data");
        }
        return membership.getHousehold();
    }

    private String normalizeFormat(String requestedFormat) {
        String format = requestedFormat == null ? "json" : requestedFormat.trim().toLowerCase(Locale.ROOT);
        if (!format.equals("json") && !format.equals("csv")) {
            throw new BadRequestException("Export format must be json or csv");
        }
        return format;
    }

    private String filename(Household household, String extension) {
        String name = household.getName() == null ? "household" : household.getName().trim();
        String safeName = name.replaceAll("[^A-Za-z0-9]+", "-").replaceAll("^-+|-+$", "");
        if (safeName.isBlank()) safeName = "household";
        return safeName.toLowerCase(Locale.ROOT) + "-inventory." + extension;
    }

    private void appendRow(StringBuilder csv, List<?> values) {
        for (int index = 0; index < values.size(); index++) {
            if (index > 0) csv.append(',');
            csv.append(csvCell(values.get(index)));
        }
        csv.append("\r\n");
    }

    private String csvCell(Object value) {
        if (value == null) return "\"\"";
        String text = value.toString();
        if (!text.isEmpty() && "=+-@".indexOf(text.charAt(0)) >= 0) text = "'" + text;
        return "\"" + text.replace("\"", "\"\"") + "\"";
    }

    public record ExportFile(byte[] content, MediaType contentType, String filename) {}
}
