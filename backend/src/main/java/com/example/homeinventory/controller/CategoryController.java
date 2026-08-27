package com.example.homeinventory.controller;

import com.example.homeinventory.dto.CategoryRequest;
import com.example.homeinventory.dto.CategoryResponse;
import com.example.homeinventory.service.CategoryService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService service;

    public CategoryController(CategoryService service) { this.service = service; }

    @GetMapping 
    public List<CategoryResponse> findAll() { 
        return service.findAll(); 
    }

    @GetMapping("/{id}") 
    public CategoryResponse findById(@PathVariable Long id) { 
        return service.findById(id); 
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@Valid @RequestBody CategoryRequest request) { 
        return service.create(request); 
    }

    @PutMapping("/{id}")
    public CategoryResponse update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { 
        service.delete(id); 
    }
}
