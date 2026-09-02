package com.example.homeinventory.controller;

import com.example.homeinventory.dto.BulkMoveItemsResponse;
import com.example.homeinventory.entity.ItemCondition;
import com.example.homeinventory.exception.GlobalExceptionHandler;
import com.example.homeinventory.service.ItemPhoto;
import com.example.homeinventory.service.ItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ItemControllerTest {
    private MockMvc mockMvc;
    private ItemService itemService;

    @BeforeEach
    void setUp() {
        itemService = mock(ItemService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new ItemController(itemService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void createRejectsBlankNameAndInvalidQuantity() throws Exception {
        String request = """
                {
                  "name": " ",
                  "quantity": 0,
                  "categoryId": 1,
                  "roomId": 1,
                  "storageLocationId": 10,
                  "estimatedValue": 10.00,
                  "condition": "%s"
                }
                """.formatted(ItemCondition.GOOD);

        mockMvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Please correct the invalid fields"))
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.fieldErrors.quantity").exists());
    }

    @Test
    void createAcceptsMissingEstimatedValue() throws Exception {
        String request = """
                {
                  "name": "Passport",
                  "quantity": 1,
                  "categoryId": 1,
                  "roomId": 1,
                  "storageLocationId": 10,
                  "condition": "%s"
                }
                """.formatted(ItemCondition.GOOD);

        mockMvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isCreated());

        verify(itemService).create(argThat(item -> item.estimatedValue() == null), eq(false));
    }

    @Test
    void createForwardsTheDuplicateConfirmation() throws Exception {
        String request = """
                {
                  "name": "Passport",
                  "quantity": 1,
                  "categoryId": 1,
                  "roomId": 1,
                  "storageLocationId": 10,
                  "condition": "%s"
                }
                """.formatted(ItemCondition.GOOD);

        mockMvc.perform(post("/api/items?allowDuplicate=true")
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isCreated());

        verify(itemService).create(any(), eq(true));
    }

    @Test
    void createRejectsMissingStorageLocation() throws Exception {
        String request = """
                {
                  "name": "Passport",
                  "quantity": 1,
                  "categoryId": 1,
                  "roomId": 1,
                  "condition": "%s"
                }
                """.formatted(ItemCondition.GOOD);

        mockMvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.storageLocationId").exists());
    }

    @Test
    void updateAcceptsMissingEstimatedValue() throws Exception {
        String request = """
                {
                  "name": "Passport",
                  "quantity": 1,
                  "categoryId": 1,
                  "roomId": 1,
                  "storageLocationId": 10,
                  "condition": "%s"
                }
                """.formatted(ItemCondition.GOOD);

        mockMvc.perform(put("/api/items/42").contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isOk());

        verify(itemService).update(eq(42L), argThat(item -> item.estimatedValue() == null));
    }

    @Test
    void bulkMoveReturnsMoveSummary() throws Exception {
        when(itemService.bulkMove(any())).thenReturn(
                new BulkMoveItemsResponse(2, 3L, "Garage", 30L, "Blue storage box"));
        String request = """
                {
                  "itemIds": [1, 1, 2],
                  "roomId": 3,
                  "storageLocationId": 30
                }
                """;

        mockMvc.perform(post("/api/items/bulk-move").contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movedCount").value(2))
                .andExpect(jsonPath("$.roomId").value(3))
                .andExpect(jsonPath("$.roomName").value("Garage"))
                .andExpect(jsonPath("$.storageLocationId").value(30))
                .andExpect(jsonPath("$.storageLocationName").value("Blue storage box"));

        verify(itemService).bulkMove(argThat(move -> move.itemIds().equals(java.util.List.of(1L, 1L, 2L))
                && move.roomId().equals(3L) && move.storageLocationId().equals(30L)));
    }

    @Test
    void bulkMoveRejectsEmptySelection() throws Exception {
        String request = """
                {
                  "itemIds": [],
                  "roomId": 3,
                  "storageLocationId": 30
                }
                """;

        mockMvc.perform(post("/api/items/bulk-move").contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Please correct the invalid fields"))
                .andExpect(jsonPath("$.fieldErrors.itemIds").exists());
    }

    @Test
    void bulkMoveRejectsInvalidIds() throws Exception {
        String request = """
                {
                  "itemIds": [1, null, -2],
                  "roomId": 0,
                  "storageLocationId": -30
                }
                """;

        mockMvc.perform(post("/api/items/bulk-move").contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors['itemIds[1]']").exists())
                .andExpect(jsonPath("$.fieldErrors['itemIds[2]']").exists())
                .andExpect(jsonPath("$.fieldErrors.roomId").exists())
                .andExpect(jsonPath("$.fieldErrors.storageLocationId").exists());
    }

    @Test
    void createRejectsNegativeEstimatedValue() throws Exception {
        String request = """
                {
                  "name": "Passport",
                  "quantity": 1,
                  "categoryId": 1,
                  "roomId": 1,
                  "storageLocationId": 10,
                  "estimatedValue": -0.01,
                  "condition": "%s"
                }
                """.formatted(ItemCondition.GOOD);

        mockMvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.estimatedValue").exists());
    }

    @Test
    void updatePhotoAcceptsMultipartFile() throws Exception {
        MockMultipartFile photo = new MockMultipartFile(
                "file", "camera.png", MediaType.IMAGE_PNG_VALUE, new byte[]{1, 2, 3});

        mockMvc.perform(multipart("/api/items/42/photo")
                        .file(photo)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        }))
                .andExpect(status().isOk());

        verify(itemService).updatePhoto(eq(42L), argThat(file -> file.getOriginalFilename().equals("camera.png")));
    }

    @Test
    void findPhotoReturnsInlineTypedResourceWithSafetyHeaders() throws Exception {
        byte[] contents = new byte[]{1, 2, 3, 4};
        when(itemService.findPhoto(42L)).thenReturn(
                new ItemPhoto(new ByteArrayResource(contents), MediaType.IMAGE_PNG));

        mockMvc.perform(get("/api/items/42/photo"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(content().bytes(contents))
                .andExpect(header().longValue("Content-Length", contents.length))
                .andExpect(header().string("Content-Disposition", "inline"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test
    void deletePhotoReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/items/42/photo"))
                .andExpect(status().isNoContent());

        verify(itemService).deletePhoto(42L);
    }
}
