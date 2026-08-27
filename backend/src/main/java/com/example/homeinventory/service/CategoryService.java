package com.example.homeinventory.service;

import com.example.homeinventory.dto.CategoryRequest;
import com.example.homeinventory.dto.CategoryResponse;
import com.example.homeinventory.entity.Category;
import com.example.homeinventory.exception.BadRequestException;
import com.example.homeinventory.exception.ResourceNotFoundException;
import com.example.homeinventory.repository.CategoryRepository;
import com.example.homeinventory.repository.ItemRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;

    public CategoryService(CategoryRepository categoryRepository, ItemRepository itemRepository) {
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
    }

    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream().map(this::toResponse).toList();
    }

    public CategoryResponse findById(Long id) { return toResponse(getEntity(id)); }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        ensureUniqueName(request.name(), null);
        Category category = new Category();
        copy(request, category);
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = getEntity(id);
        ensureUniqueName(request.name(), category.getName());
        copy(request, category);
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public void delete(Long id) { categoryRepository.delete(getEntity(id)); }

    public Category getEntity(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category with id " + id + " was not found"));
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getColor(),
                itemRepository.countByCategoryId(category.getId()));
    }

    private void copy(CategoryRequest request, Category category) {
        category.setName(request.name().trim());
        category.setColor(request.color());
    }

    private void ensureUniqueName(String name, String currentName) {
        if ((currentName == null || !currentName.equalsIgnoreCase(name.trim()))
                && categoryRepository.existsByNameIgnoreCase(name.trim())) {
            throw new BadRequestException("A category named '" + name.trim() + "' already exists");
        }
    }
}
