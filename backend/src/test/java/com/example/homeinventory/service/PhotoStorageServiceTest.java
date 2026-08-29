package com.example.homeinventory.service;

import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.PhotoStorageException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;

class PhotoStorageServiceTest {
    @TempDir
    Path storageDirectory;

    @ParameterizedTest
    @MethodSource("validImages")
    void storesAllowedImagesUsingGeneratedSafeFilenames(String contentType, String extension, byte[] contents)
            throws Exception {
        PhotoStorageService service = new PhotoStorageService(storageDirectory.toString());
        MockMultipartFile file = new MockMultipartFile("file", "../../unsafe.exe", contentType, contents);

        PhotoStorageService.StoredPhoto stored = service.store(file);

        assertEquals(contentType, stored.contentType());
        assertTrue(stored.filename().matches("[0-9a-f-]{36}\\." + extension));
        assertArrayEquals(contents, service.load(stored.filename()).getInputStream().readAllBytes());
        assertTrue(Files.isRegularFile(storageDirectory.resolve(stored.filename())));

        service.delete(stored.filename());
        assertFalse(Files.exists(storageDirectory.resolve(stored.filename())));
    }

    @Test
    void rejectsEmptyOversizedUnsupportedAndMismatchedFiles() {
        PhotoStorageService service = new PhotoStorageService(storageDirectory.toString());
        byte[] oversized = new byte[(int) PhotoStorageService.MAX_PHOTO_SIZE + 1];
        byte[] jpeg = new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff, 0x00};

        assertThrows(BadRequestException.class,
                () -> service.store(new MockMultipartFile("file", "empty.png", "image/png", new byte[0])));
        assertThrows(BadRequestException.class,
                () -> service.store(new MockMultipartFile("file", "large.png", "image/png", oversized)));
        assertThrows(BadRequestException.class,
                () -> service.store(new MockMultipartFile("file", "text.txt", "text/plain", "hello".getBytes())));
        assertThrows(BadRequestException.class,
                () -> service.store(new MockMultipartFile("file", "fake.png", "image/png", jpeg)));
    }

    @Test
    void refusesStoredFilenamesThatCouldEscapeTheConfiguredDirectory() {
        PhotoStorageService service = new PhotoStorageService(storageDirectory.toString());

        assertThrows(PhotoStorageException.class, () -> service.load("../outside.png"));
        assertThrows(PhotoStorageException.class, () -> service.delete("subdirectory/photo.png"));
    }

    private static Stream<Arguments> validImages() {
        return Stream.of(
                Arguments.of("image/jpeg", "jpg",
                        new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff, (byte) 0xe0}),
                Arguments.of("image/png", "png",
                        new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}),
                Arguments.of("image/webp", "webp", webpHeader()),
                Arguments.of("image/gif", "gif", "GIF89a".getBytes(StandardCharsets.US_ASCII)));
    }

    private static byte[] webpHeader() {
        return new byte[]{'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'};
    }
}
