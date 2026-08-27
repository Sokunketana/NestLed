package com.example.homeinventory.controller;

import com.example.homeinventory.entity.ItemCondition;
import com.example.homeinventory.exception.GlobalExceptionHandler;
import com.example.homeinventory.service.ItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
                  "condition": "%s"
                }
                """.formatted(ItemCondition.GOOD);

        mockMvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isCreated());

        verify(itemService).create(argThat(item -> item.estimatedValue() == null));
    }

    @Test
    void updateAcceptsMissingEstimatedValue() throws Exception {
        String request = """
                {
                  "name": "Passport",
                  "quantity": 1,
                  "categoryId": 1,
                  "roomId": 1,
                  "condition": "%s"
                }
                """.formatted(ItemCondition.GOOD);

        mockMvc.perform(put("/api/items/42").contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isOk());

        verify(itemService).update(eq(42L), argThat(item -> item.estimatedValue() == null));
    }

    @Test
    void createRejectsNegativeEstimatedValue() throws Exception {
        String request = """
                {
                  "name": "Passport",
                  "quantity": 1,
                  "categoryId": 1,
                  "roomId": 1,
                  "estimatedValue": -0.01,
                  "condition": "%s"
                }
                """.formatted(ItemCondition.GOOD);

        mockMvc.perform(post("/api/items").contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.estimatedValue").exists());
    }
}
