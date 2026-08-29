package com.example.homeinventory.service;

import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.PhotoStorageException;
import com.example.homeinventory.exception.ResourceNotFoundException;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PhotoStorageService {
    static final long MAX_PHOTO_SIZE = 5L * 1024L * 1024L;

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif");
    private static final Pattern SAFE_FILENAME = Pattern.compile(
            "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.(jpg|png|webp|gif)$");

    private final Path storageRoot;

    public PhotoStorageService(@Value("${app.photo-storage.location:uploads}") String storageLocation) {
        String location = StringUtils.hasText(storageLocation) ? storageLocation : "uploads";
        storageRoot = Path.of(location).toAbsolutePath().normalize();
        try {
            Files.createDirectories(storageRoot);
        } catch (IOException ex) {
            throw new IllegalStateException("Could not initialize photo storage", ex);
        }
    }

    public StoredPhoto store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select a non-empty photo");
        }
        if (file.getSize() > MAX_PHOTO_SIZE) {
            throw new BadRequestException("Photo must be 5 MB or smaller");
        }

        String contentType = normalizeContentType(file.getContentType());
        String extension = EXTENSIONS.get(contentType);
        if (extension == null) {
            throw new BadRequestException("Photo must be a JPEG, PNG, WebP, or GIF image");
        }

        byte[] contents;
        try {
            contents = file.getBytes();
        } catch (IOException ex) {
            throw new PhotoStorageException("Could not read the uploaded photo", ex);
        }
        if (contents.length == 0) {
            throw new BadRequestException("Please select a non-empty photo");
        }
        if (contents.length > MAX_PHOTO_SIZE) {
            throw new BadRequestException("Photo must be 5 MB or smaller");
        }
        if (!hasExpectedSignature(contents, contentType)) {
            throw new BadRequestException("The uploaded file does not match its declared image type");
        }

        String filename = UUID.randomUUID() + extension;
        Path destination = resolveStoredFilename(filename);
        try {
            Files.write(destination, contents, StandardOpenOption.CREATE_NEW);
        } catch (IOException ex) {
            throw new PhotoStorageException("Could not store the uploaded photo", ex);
        }
        return new StoredPhoto(filename, contentType);
    }

    public Resource load(String filename) {
        Path photo = resolveStoredFilename(filename);
        if (!Files.isRegularFile(photo) || !Files.isReadable(photo)) {
            throw new ResourceNotFoundException("The stored photo was not found");
        }
        return new FileSystemResource(photo);
    }

    public void delete(String filename) {
        if (filename == null) {
            return;
        }
        Path photo = resolveStoredFilename(filename);
        try {
            Files.deleteIfExists(photo);
        } catch (IOException ex) {
            throw new PhotoStorageException("Could not remove the stored photo", ex);
        }
    }

    private Path resolveStoredFilename(String filename) {
        if (filename == null || !SAFE_FILENAME.matcher(filename).matches()) {
            throw new PhotoStorageException("Invalid stored photo filename");
        }
        Path resolved = storageRoot.resolve(filename).normalize();
        if (!resolved.startsWith(storageRoot)) {
            throw new PhotoStorageException("Stored photo path is outside the configured directory");
        }
        return resolved;
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null) {
            return "";
        }
        int parameters = contentType.indexOf(';');
        String mediaType = parameters >= 0 ? contentType.substring(0, parameters) : contentType;
        return mediaType.trim().toLowerCase(Locale.ROOT);
    }

    private boolean hasExpectedSignature(byte[] contents, String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> startsWith(contents, new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff});
            case "image/png" -> startsWith(contents,
                    new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a});
            case "image/gif" -> startsWith(contents, "GIF87a".getBytes(StandardCharsets.US_ASCII))
                    || startsWith(contents, "GIF89a".getBytes(StandardCharsets.US_ASCII));
            case "image/webp" -> contents.length >= 12
                    && Arrays.equals(Arrays.copyOfRange(contents, 0, 4), "RIFF".getBytes(StandardCharsets.US_ASCII))
                    && Arrays.equals(Arrays.copyOfRange(contents, 8, 12), "WEBP".getBytes(StandardCharsets.US_ASCII));
            default -> false;
        };
    }

    private boolean startsWith(byte[] contents, byte[] signature) {
        return contents.length >= signature.length
                && Arrays.equals(Arrays.copyOf(contents, signature.length), signature);
    }

    public record StoredPhoto(String filename, String contentType) {}
}
