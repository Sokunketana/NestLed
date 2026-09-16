package com.example.homeinventory.controller;

import com.example.homeinventory.dto.HouseholdExportPreviewResponse;
import com.example.homeinventory.dto.HouseholdImportPreviewResponse;
import com.example.homeinventory.dto.HouseholdImportResultResponse;
import com.example.homeinventory.service.HouseholdExportService;
import com.example.homeinventory.service.HouseholdImportService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/household")
public class HouseholdExportController {
    private final HouseholdExportService exportService;
    private final HouseholdImportService importService;

    public HouseholdExportController(HouseholdExportService exportService, HouseholdImportService importService) {
        this.exportService = exportService;
        this.importService = importService;
    }

    @GetMapping("/export/preview")
    public HouseholdExportPreviewResponse preview(@RequestParam(defaultValue = "json") String format) {
        return exportService.preview(format);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(@RequestParam(defaultValue = "json") String format) {
        HouseholdExportService.ExportFile file = exportService.export(format);
        return ResponseEntity.ok()
                .contentType(file.contentType())
                .contentLength(file.content().length)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(file.filename(), StandardCharsets.UTF_8).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(file.content());
    }

    @PostMapping(value = "/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public HouseholdImportPreviewResponse importPreview(@RequestPart("file") MultipartFile file) {
        return importService.preview(file);
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public HouseholdImportResultResponse importData(@RequestPart("file") MultipartFile file) {
        return importService.importData(file);
    }
}
