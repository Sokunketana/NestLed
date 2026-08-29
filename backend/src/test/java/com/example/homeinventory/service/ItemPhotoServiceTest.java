package com.example.homeinventory.service;

import com.example.homeinventory.entity.Category;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.entity.ItemCondition;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.repository.ItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
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

    @BeforeEach
    void setUp() {
        items = mock(ItemRepository.class);
        photos = mock(PhotoStorageService.class);
        service = new ItemService(items, mock(RoomService.class), mock(CategoryService.class),
                mock(StorageLocationService.class), photos);
    }

    @AfterEach
    void clearTransactionSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void replacesPhotoAfterDatabaseFlushAndReturnsPhotoUrl() {
        Item item = itemWithPhoto("11111111-1111-4111-8111-111111111111.jpg", "image/jpeg");
        MultipartFile upload = mock(MultipartFile.class);
        String newFilename = "22222222-2222-4222-8222-222222222222.png";
        when(items.findById(42L)).thenReturn(java.util.Optional.of(item));
        when(photos.store(upload)).thenReturn(new PhotoStorageService.StoredPhoto(newFilename, "image/png"));
        when(items.saveAndFlush(item)).thenReturn(item);

        var response = service.updatePhoto(42L, upload);

        assertEquals("items/42/photo", response.photoUrl());
        assertEquals(newFilename, item.getPhotoFilename());
        assertEquals("image/png", item.getPhotoContentType());
        InOrder order = inOrder(items, photos);
        order.verify(items).findById(42L);
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
        when(items.findById(42L)).thenReturn(java.util.Optional.of(item));
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
        when(items.findById(42L)).thenReturn(java.util.Optional.of(item));
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
        when(items.findById(42L)).thenReturn(java.util.Optional.of(item));
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
        when(items.findById(42L)).thenReturn(java.util.Optional.of(item));

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
        return item;
    }
}
