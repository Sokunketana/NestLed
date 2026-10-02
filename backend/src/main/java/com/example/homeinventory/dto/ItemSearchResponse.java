package com.example.homeinventory.dto;

import java.util.List;

public record ItemSearchResponse(List<ItemResponse> content, int page, int size, boolean hasNext) {}
