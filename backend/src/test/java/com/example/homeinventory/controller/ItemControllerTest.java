package com.example.homeinventory.controller;

import com.example.homeinventory.entity.ItemCondition;
import com.example.homeinventory.exception.GlobalExceptionHandler;
import com.example.homeinventory.service.ItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ItemControllerTest {
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ItemService itemService = mock(ItemService.class);
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
}
