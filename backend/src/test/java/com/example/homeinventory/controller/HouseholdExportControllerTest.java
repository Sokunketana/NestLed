package com.example.homeinventory.controller;

import com.example.homeinventory.service.HouseholdExportService;
import com.example.homeinventory.service.HouseholdImportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.mock.web.MockMultipartFile;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HouseholdExportControllerTest {
    private MockMvc mockMvc;
    private HouseholdExportService exportService;
    private HouseholdImportService importService;

    @BeforeEach
    void setUp() {
        exportService = mock(HouseholdExportService.class);
        importService = mock(HouseholdImportService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new HouseholdExportController(exportService, importService)).build();
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

    @Test
    void previewsAndCommitsAJsonImport() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "backup.json", MediaType.APPLICATION_JSON_VALUE,
                "{}".getBytes());
        when(importService.preview(org.mockito.ArgumentMatchers.same(file))).thenReturn(
                new com.example.homeinventory.dto.HouseholdImportPreviewResponse(
                        "Old home", 1, "New home", 1, 2, 1, 3, 1, 2, 4, 0, 0,
                        java.util.List.of(), java.util.List.of(), true));
        when(importService.importData(org.mockito.ArgumentMatchers.same(file))).thenReturn(
                new com.example.homeinventory.dto.HouseholdImportResultResponse(
                        "Old home", "New home", 1, 1, 1, 4, 0, 0));

        mockMvc.perform(multipart("/api/household/import/preview").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sourceHouseholdName").value("Old home"))
                .andExpect(jsonPath("$.itemsToImport").value(4))
                .andExpect(jsonPath("$.canImport").value(true));

        mockMvc.perform(multipart("/api/household/import").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemsImported").value(4));
    }
}
