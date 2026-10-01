package com.example.homeinventory.service;

import com.example.homeinventory.entity.Category;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.entity.ItemCondition;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.entity.StorageLocation;
import com.example.homeinventory.repository.ItemRepository;
import com.example.homeinventory.repository.HouseholdRepository;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InOrder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class ItemPhotoServiceTest {
    private ItemRepository items;
    private PhotoStorageService photos;
    private ItemService service;
    private HouseholdRepository households;

    @BeforeEach
    void setUp() {
        items = mock(ItemRepository.class);
        photos = mock(PhotoStorageService.class);
        Household household = mock(Household.class);
        when(household.getId()).thenReturn(99L);
        HouseholdAccessService access = mock(HouseholdAccessService.class);
        when(access.getActiveHousehold()).thenReturn(household);
        households = mock(HouseholdRepository.class);
        when(households.findByIdForPhotoUpload(99L)).thenReturn(java.util.Optional.of(household));
        service = new ItemService(items, mock(RoomService.class), mock(CategoryService.class),
                mock(StorageLocationService.class), photos, access, mock(ItemMovementService.class), households, 100);
    }

    @AfterEach
    void clearTransactionSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void rejectsMissingHouseholdBeforeWritingFiles() {
        when(households.findByIdForPhotoUpload(99L)).thenReturn(java.util.Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> service.updatePhoto(42L, mock(MultipartFile.class)));
        verifyNoInteractions(items, photos);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1})
    void refusesNonPositiveQuotaConfiguration(int limit) {
        assertThrows(IllegalArgumentException.class, () -> new ItemService(items,
                mock(RoomService.class), mock(CategoryService.class), mock(StorageLocationService.class),
                photos, mock(HouseholdAccessService.class), mock(ItemMovementService.class), households, limit));
    }

    @Test
    void rejectsNewPhotosAtOrAboveHouseholdLimitBeforeWritingFiles() {
        Item item = itemWithPhoto(null, null);
        MultipartFile upload = mock(MultipartFile.class);
        when(items.findByIdAndHouseholdId(42L, 99L)).thenReturn(java.util.Optional.of(item));
        when(items.countByHouseholdIdAndPhotoFilenameIsNotNull(99L)).thenReturn(100L, 101L);

        for (int attempt = 0; attempt < 2; attempt++) {
            BadRequestException error = assertThrows(BadRequestException.class,
                    () -> service.updatePhoto(42L, upload));
            assertEquals("Household photo limit of 100 reached. Remove an existing photo before uploading another",
                    error.getMessage());
        }
        verifyNoInteractions(photos);
        verify(items, never()).saveAndFlush(any());
    }

    @Test
    void acceptsLastAvailableSlotAfterLockingHouseholdAndCheckingItsCount() {
        Item item = itemWithPhoto(null, null);
        MultipartFile upload = mock(MultipartFile.class);
        when(items.findByIdAndHouseholdId(42L, 99L)).thenReturn(java.util.Optional.of(item));
        when(items.countByHouseholdIdAndPhotoFilenameIsNotNull(99L)).thenReturn(99L);
        when(photos.store(upload)).thenReturn(new PhotoStorageService.StoredPhoto(
                "22222222-2222-4222-8222-222222222222.png", "image/png"));
        when(items.saveAndFlush(item)).thenReturn(item);

        service.updatePhoto(42L, upload);

        InOrder order = inOrder(households, items, photos);
        order.verify(households).findByIdForPhotoUpload(99L);
        order.verify(items).findByIdAndHouseholdId(42L, 99L);
        order.verify(items).countByHouseholdIdAndPhotoFilenameIsNotNull(99L);
        order.verify(photos).store(upload);
        order.verify(items).saveAndFlush(item);
    }

    @Test
    void rejectsItemsOutsideActiveHouseholdBeforeWritingFiles() {
        assertThrows(ResourceNotFoundException.class,
                () -> service.updatePhoto(42L, mock(MultipartFile.class)));
        verifyNoInteractions(photos);
        verify(items, never()).countByHouseholdIdAndPhotoFilenameIsNotNull(any());
    }

    @Test
    void replacesPhotoAfterDatabaseFlushAndReturnsPhotoUrl() {
        Item item = itemWithPhoto("11111111-1111-4111-8111-111111111111.jpg", "image/jpeg");
        MultipartFile upload = mock(MultipartFile.class);
        String newFilename = "22222222-2222-4222-8222-222222222222.png";
        when(items.findByIdAndHouseholdId(42L, 99L)).thenReturn(java.util.Optional.of(item));
        when(photos.store(upload)).thenReturn(new PhotoStorageService.StoredPhoto(newFilename, "image/png"));
        when(items.saveAndFlush(item)).thenReturn(item);

        var response = service.updatePhoto(42L, upload);

        assertEquals("items/42/photo", response.photoUrl());
        assertEquals(newFilename, item.getPhotoFilename());
        assertEquals("image/png", item.getPhotoContentType());
        verify(items, never()).countByHouseholdIdAndPhotoFilenameIsNotNull(any());
        InOrder order = inOrder(items, photos);
        order.verify(items).findByIdAndHouseholdId(42L, 99L);
        order.verify(photos).store(upload);
        order.verify(items).saveAndFlush(item);
        order.verify(photos).delete("11111111-1111-4111-8111-111111111111.jpg");
    }

    @Test
    void removesNewFileAndKeepsOldFileWhenDatabaseFlushFails() {
        String oldFilename = "11111111-1111-4111-8111-111111111111.jpg";
        String newFilename = "22222222-2222-4222-8222-222222222222.png";
        Item item = itemWithPhoto(oldFilename, "image/jpeg");
        MultipartFile upload = mock(MultipartFile.class);
        when(items.findByIdAndHouseholdId(42L, 99L)).thenReturn(java.util.Optional.of(item));
        when(photos.store(upload)).thenReturn(new PhotoStorageService.StoredPhoto(newFilename, "image/png"));
        when(items.saveAndFlush(item)).thenThrow(new RuntimeException("database unavailable"));

        assertThrows(RuntimeException.class, () -> service.updatePhoto(42L, upload));

        verify(photos).delete(newFilename);
        verify(photos, never()).delete(oldFilename);
    }

    @Test
    void defersOldFileDeletionUntilCommitAndRemovesNewFileOnRollback() {
        String oldFilename = "11111111-1111-4111-8111-111111111111.jpg";
        String newFilename = "22222222-2222-4222-8222-222222222222.png";
        Item item = itemWithPhoto(oldFilename, "image/jpeg");
        MultipartFile upload = mock(MultipartFile.class);
        when(items.findByIdAndHouseholdId(42L, 99L)).thenReturn(java.util.Optional.of(item));
        when(photos.store(upload)).thenReturn(new PhotoStorageService.StoredPhoto(newFilename, "image/png"));
        when(items.saveAndFlush(item)).thenReturn(item);
        TransactionSynchronizationManager.initSynchronization();

        service.updatePhoto(42L, upload);

        verify(photos, never()).delete(oldFilename);
        verify(photos, never()).delete(newFilename);
        for (TransactionSynchronization synchronization : TransactionSynchronizationManager.getSynchronizations()) {
            synchronization.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
        }
        verify(photos).delete(newFilename);
        verify(photos, never()).delete(oldFilename);
    }

    @Test
    void deletesSupersededFileOnlyAfterCommit() {
        String oldFilename = "11111111-1111-4111-8111-111111111111.jpg";
        String newFilename = "22222222-2222-4222-8222-222222222222.png";
        Item item = itemWithPhoto(oldFilename, "image/jpeg");
        MultipartFile upload = mock(MultipartFile.class);
        when(items.findByIdAndHouseholdId(42L, 99L)).thenReturn(java.util.Optional.of(item));
        when(photos.store(upload)).thenReturn(new PhotoStorageService.StoredPhoto(newFilename, "image/png"));
        when(items.saveAndFlush(item)).thenReturn(item);
        TransactionSynchronizationManager.initSynchronization();

        service.updatePhoto(42L, upload);

        for (TransactionSynchronization synchronization : TransactionSynchronizationManager.getSynchronizations()) {
            synchronization.afterCommit();
            synchronization.afterCompletion(TransactionSynchronization.STATUS_COMMITTED);
        }
        verify(photos).delete(oldFilename);
        verify(photos, never()).delete(newFilename);
    }

    @Test
    void deletesStoredPhotoAfterItemDeletionIsFlushed() {
        String filename = "11111111-1111-4111-8111-111111111111.jpg";
        Item item = itemWithPhoto(filename, "image/jpeg");
        when(items.findByIdAndHouseholdId(42L, 99L)).thenReturn(java.util.Optional.of(item));

        service.delete(42L);

        InOrder order = inOrder(items, photos);
        order.verify(items).delete(item);
        order.verify(items).flush();
        order.verify(photos).delete(filename);
    }

    private Item itemWithPhoto(String filename, String contentType) {
        Item item = new Item();
        ReflectionTestUtils.setField(item, "id", 42L);
        item.setName("Camera");
        item.setQuantity(1);
        item.setCondition(ItemCondition.GOOD);
        item.setPhotoFilename(filename);
        item.setPhotoContentType(contentType);

        Category category = mock(Category.class);
        when(category.getId()).thenReturn(1L);
        when(category.getName()).thenReturn("Electronics");
        when(category.getColor()).thenReturn("#000000");
        item.setCategory(category);

        Room room = mock(Room.class);
        when(room.getId()).thenReturn(1L);
        when(room.getName()).thenReturn("Office");
        item.setRoom(room);

        StorageLocation location = mock(StorageLocation.class);
        when(location.getId()).thenReturn(10L);
        when(location.getName()).thenReturn("Desk drawer");
        when(location.getRoom()).thenReturn(room);
        item.setStorageLocation(location);
        return item;
    }
}
