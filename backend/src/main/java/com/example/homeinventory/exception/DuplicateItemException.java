package com.example.homeinventory.exception;

import com.example.homeinventory.dto.ItemResponse;
import java.util.List;

public class DuplicateItemException extends RuntimeException {
    private final List<ItemResponse> duplicateItems;

    public DuplicateItemException(List<ItemResponse> duplicateItems) {
        super("A similar item already exists in this storage location");
        this.duplicateItems = List.copyOf(duplicateItems);
    }

    public List<ItemResponse> getDuplicateItems() {
        return duplicateItems;
    }
}
