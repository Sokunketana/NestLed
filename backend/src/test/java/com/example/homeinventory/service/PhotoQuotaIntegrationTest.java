package com.example.homeinventory.service;

import com.example.homeinventory.entity.Category;
import com.example.homeinventory.entity.Household;
import com.example.homeinventory.entity.Item;
import com.example.homeinventory.entity.ItemCondition;
import com.example.homeinventory.entity.Room;
import com.example.homeinventory.entity.StorageLocation;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.repository.HouseholdRepository;
import com.example.homeinventory.repository.ItemRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DataJpaTest(properties = {
        "spring.config.import=",
        "spring.sql.init.mode=never",
        "spring.jpa.hibernate.ddl-auto=create-drop"
}, showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class PhotoQuotaIntegrationTest {
    @Autowired ItemRepository items;
    @Autowired HouseholdRepository households;
    @Autowired PlatformTransactionManager transactionManager;
    @PersistenceContext EntityManager entityManager;
    @TempDir Path storageDirectory;

    @Test
    void concurrentUploadsCannotBothClaimLastSlot() throws Exception {
        Fixture fixture = fixture();
        PhotoStorageService photos = spy(new PhotoStorageService(storageDirectory.toString()));
        ItemService service = service(fixture.household(), photos);
        CountDownLatch firstWriting = new CountDownLatch(1);
        CountDownLatch releaseFirst = new CountDownLatch(1);
        CountDownLatch secondStarted = new CountDownLatch(1);
        doAnswer(invocation -> {
            firstWriting.countDown();
            assertTrue(releaseFirst.await(5, TimeUnit.SECONDS));
            return invocation.callRealMethod();
        }).when(photos).store(any());

        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> transaction().execute(
                    status -> service.updatePhoto(fixture.firstItem(), upload())));
            try {
                assertTrue(firstWriting.await(5, TimeUnit.SECONDS));
                var second = executor.submit(() -> {
                    secondStarted.countDown();
                    return assertThrows(BadRequestException.class, () -> transaction().execute(
                            status -> service.updatePhoto(fixture.secondItem(), upload())));
                });
                assertTrue(secondStarted.await(5, TimeUnit.SECONDS));
                assertThrows(TimeoutException.class, () -> second.get(200, TimeUnit.MILLISECONDS));
                releaseFirst.countDown();
                assertNotNull(first.get(5, TimeUnit.SECONDS));
                assertTrue(second.get(5, TimeUnit.SECONDS).getMessage().contains("Household photo limit of 1"));
            } finally {
                releaseFirst.countDown();
            }
        }

        assertEquals(1L, items.countByHouseholdIdAndPhotoFilenameIsNotNull(fixture.household().getId()));
        verify(photos, times(1)).store(any());
        try (var files = Files.list(storageDirectory)) {
            assertEquals(1L, files.count());
        }
    }

    @Test
    void rollbackReleasesSlotAndDeletionAllowsAnotherUpload() throws Exception {
        Fixture fixture = fixture();
        ItemService service = service(fixture.household(), new PhotoStorageService(storageDirectory.toString()));
        transaction().executeWithoutResult(status -> {
            service.updatePhoto(fixture.firstItem(), upload());
            status.setRollbackOnly();
        });
        assertEquals(0L, items.countByHouseholdIdAndPhotoFilenameIsNotNull(fixture.household().getId()));
        try (var files = Files.list(storageDirectory)) {
            assertEquals(0L, files.count());
        }

        transaction().executeWithoutResult(status -> service.updatePhoto(fixture.secondItem(), upload()));
        // Replacements remain allowed at the limit and remove the superseded file.
        transaction().executeWithoutResult(status -> service.updatePhoto(fixture.secondItem(), upload()));
        transaction().executeWithoutResult(status -> service.deletePhoto(fixture.secondItem()));
        transaction().executeWithoutResult(status -> service.updatePhoto(fixture.firstItem(), upload()));
        assertEquals(1L, items.countByHouseholdIdAndPhotoFilenameIsNotNull(fixture.household().getId()));
        try (var files = Files.list(storageDirectory)) {
            assertEquals(1L, files.count());
        }
    }

    @Test
    void countsExistingPhotosButDoesNotChargeAnotherHouseholdsQuota() {
        Fixture first = fixture();
        Fixture second = fixture();
        ItemService firstService = service(first.household(), new PhotoStorageService(storageDirectory.toString()));
        transaction().executeWithoutResult(status -> firstService.updatePhoto(first.firstItem(), upload()));
        // A fresh service sees the persisted usage without an in-memory quota counter.
        ItemService restarted = service(first.household(), new PhotoStorageService(storageDirectory.toString()));
        assertThrows(BadRequestException.class, () -> transaction().executeWithoutResult(
                status -> restarted.updatePhoto(first.secondItem(), upload())));
        ItemService other = service(second.household(), new PhotoStorageService(storageDirectory.toString()));
        transaction().executeWithoutResult(status -> other.updatePhoto(second.firstItem(), upload()));
        assertEquals(1L, items.countByHouseholdIdAndPhotoFilenameIsNotNull(second.household().getId()));
    }

    private ItemService service(Household household, PhotoStorageService photos) {
        HouseholdAccessService access = mock(HouseholdAccessService.class);
        when(access.getActiveHousehold()).thenReturn(household);
        return new ItemService(items, mock(RoomService.class), mock(CategoryService.class),
                mock(StorageLocationService.class), photos, access, mock(ItemMovementService.class), households, 1);
    }

    private TransactionTemplate transaction() {
        return new TransactionTemplate(transactionManager);
    }

    private MockMultipartFile upload() {
        return new MockMultipartFile("file", "photo.jpg", "image/jpeg",
                new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff, 0});
    }

    private Fixture fixture() {
        return transaction().execute(status -> {
            Household household = households.saveAndFlush(new Household("Photo quota test"));
            Category category = new Category();
            category.setName("Electronics");
            category.setHousehold(household);
            entityManager.persist(category);
            Room room = new Room();
            room.setName("Office");
            room.setHousehold(household);
            entityManager.persist(room);
            StorageLocation location = new StorageLocation();
            location.setName("Desk");
            location.setRoom(room);
            location.setHousehold(household);
            entityManager.persist(location);
            Item first = item(household, category, room, location);
            Item second = item(household, category, room, location);
            return new Fixture(household, first.getId(), second.getId());
        });
    }

    private Item item(Household household, Category category, Room room, StorageLocation location) {
        Item item = new Item();
        item.setName("Camera");
        item.setQuantity(1);
        item.setCondition(ItemCondition.GOOD);
        item.setHousehold(household);
        item.setCategory(category);
        item.setRoom(room);
        item.setStorageLocation(location);
        return items.saveAndFlush(item);
    }

    private record Fixture(Household household, Long firstItem, Long secondItem) {}
}
