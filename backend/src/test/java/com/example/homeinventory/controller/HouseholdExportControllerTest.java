package com.example.homeinventory.controller;

import com.example.homeinventory.service.HouseholdExportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HouseholdExportControllerTest {
    private MockMvc mockMvc;
    private HouseholdExportService exportService;

    @BeforeEach
    void setUp() {
        exportService = mock(HouseholdExportService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new HouseholdExportController(exportService)).build();
    }

    @Test
    void returnsDownloadHeadersAndExportContent() throws Exception {
        when(exportService.export("json"))
                .thenReturn(new HouseholdExportService.ExportFile(
                "{\"format\":\"nestled-household-export\"}".getBytes(),
                MediaType.APPLICATION_JSON,
                "our-home-inventory.json"));

        mockMvc.perform(get("/api/household/export"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().json("{\"format\":\"nestled-household-export\"}"))
                .andExpect(header().string("Content-Disposition",
                        org.hamcrest.Matchers.containsString("our-home-inventory.json")))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }
}
