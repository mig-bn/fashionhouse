package com.fashionhouse.application.service;

import com.fashionhouse.domain.exception.ResourceNotFoundException;
import com.fashionhouse.infrastructure.persistence.entity.CategoryEntity;
import com.fashionhouse.infrastructure.persistence.repository.CategoryRepository;
import com.fashionhouse.interfaces.rest.dto.category.CategoryDto;
import com.fashionhouse.interfaces.rest.dto.category.CreateCategoryRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryDto> findAll() {
        return categoryRepository.findByParentIsNull().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> findActive() {
        return categoryRepository.findByActiveTrue().stream()
                .filter(c -> c.getParent() == null)
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryDto findBySlug(String slug) {
        return categoryRepository.findBySlug(slug)
                .map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría", slug));
    }

    @Transactional
    public CategoryDto create(CreateCategoryRequest request) {
        String slug = request.slug() != null && !request.slug().isBlank()
                ? request.slug()
                : slugify(request.name());

        if (categoryRepository.findBySlug(slug).isPresent()) {
            throw new IllegalArgumentException("Ya existe una categoría con ese slug: " + slug);
        }

        CategoryEntity parent = null;
        if (request.parentId() != null) {
            parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoría padre", request.parentId().toString()));
        }

        CategoryEntity entity = CategoryEntity.builder()
                .name(request.name())
                .slug(slug)
                .description(request.description())
                .parent(parent)
                .sortOrder(request.sortOrder())
                .active(true)
                .build();

        return toDto(categoryRepository.save(entity));
    }

    @Transactional
    public CategoryDto update(UUID id, CreateCategoryRequest request) {
        CategoryEntity entity = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría", id.toString()));

        if (request.name() != null && !request.name().isBlank()) {
            entity.setName(request.name());
        }
        if (request.slug() != null && !request.slug().isBlank()) {
            entity.setSlug(request.slug());
        }
        if (request.description() != null) {
            entity.setDescription(request.description());
        }
        entity.setSortOrder(request.sortOrder());
        if (request.parentId() != null) {
            CategoryEntity parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoría padre", request.parentId().toString()));
            entity.setParent(parent);
        }
        return toDto(categoryRepository.save(entity));
    }

    @Transactional
    public void toggleActive(UUID id) {
        CategoryEntity entity = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría", id.toString()));
        entity.setActive(!entity.isActive());
        categoryRepository.save(entity);
    }

    private CategoryDto toDto(CategoryEntity e) {
        List<CategoryDto> children = e.getChildren().stream()
                .map(this::toDto)
                .toList();
        return new CategoryDto(
                e.getId(), e.getName(), e.getSlug(), e.getDescription(),
                e.getParent() != null ? e.getParent().getId() : null,
                e.isActive(), e.getSortOrder(), children
        );
    }

    private String slugify(String text) {
        return text.toLowerCase()
                .replaceAll("[áàäâ]", "a").replaceAll("[éèëê]", "e")
                .replaceAll("[íìïî]", "i").replaceAll("[óòöô]", "o")
                .replaceAll("[úùüû]", "u").replaceAll("ñ", "n")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }
}
