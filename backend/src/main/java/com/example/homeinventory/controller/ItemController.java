package com.example.homeinventory.controller;

import com.example.homeinventory.dto.CreateItemRequest;
import com.example.homeinventory.dto.ItemResponse;
import com.example.homeinventory.dto.UpdateItemRequest;
import com.example.homeinventory.service.ItemPhoto;
import com.example.homeinventory.service.ItemService;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/items")
public class ItemController {
    private final ItemService itemService;
    public ItemController(ItemService itemService) { this.itemService = itemService; }

    @GetMapping
    public List<ItemResponse> findAll(@RequestParam(required = false) Long roomId, @RequestParam(required = false) Long categoryId) {
        return itemService.findAll(roomId, categoryId);
    }

    @GetMapping("/search")
    public List<ItemResponse> search(@RequestParam String name) { 
        return itemService.search(name); 
    }

    @GetMapping("/{id}")
    public ItemResponse findById(@PathVariable Long id) { 
        return itemService.findById(id); 
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ItemResponse create(@Valid @RequestBody CreateItemRequest request) { 
        return itemService.create(request); 
    }

    @PutMapping("/{id}")
    public ItemResponse update(@PathVariable Long id, @Valid @RequestBody UpdateItemRequest request) {
        return itemService.update(id, request);
    }

    @PutMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ItemResponse updatePhoto(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        return itemService.updatePhoto(id, file);
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<Resource> findPhoto(@PathVariable Long id) throws IOException {
        ItemPhoto photo = itemService.findPhoto(id);
        return ResponseEntity.ok()
                .contentType(photo.contentType())
                .contentLength(photo.resource().contentLength())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(photo.resource());
    }

    @DeleteMapping("/{id}/photo")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePhoto(@PathVariable Long id) {
        itemService.deletePhoto(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        itemService.delete(id); 
    }
}
