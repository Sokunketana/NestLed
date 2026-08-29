package com.example.homeinventory.service;

import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;

public record ItemPhoto(Resource resource, MediaType contentType) {}
