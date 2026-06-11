package com.fashionhouse.interfaces.rest.controller;

import com.fashionhouse.application.service.CategoryService;
import com.fashionhouse.interfaces.rest.dto.ApiResponse;
import com.fashionhouse.interfaces.rest.dto.category.CategoryDto;
import com.fashionhouse.interfaces.rest.dto.category.CreateCategoryRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Categorías", description = "Gestión del árbol de categorías")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Listar categorías raíz activas (con hijos)")
    public ApiResponse<List<CategoryDto>> listActive() {
        return ApiResponse.ok(categoryService.findActive());
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Listar todas las categorías (admin)")
    public ApiResponse<List<CategoryDto>> listAll() {
        return ApiResponse.ok(categoryService.findAll());
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Obtener categoría por slug")
    public ApiResponse<CategoryDto> getBySlug(@PathVariable String slug) {
        return ApiResponse.ok(categoryService.findBySlug(slug));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Crear categoría")
    public ApiResponse<CategoryDto> create(@Valid @RequestBody CreateCategoryRequest request) {
        return ApiResponse.ok(categoryService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Actualizar categoría")
    public ApiResponse<CategoryDto> update(
            @PathVariable UUID id,
            @RequestBody CreateCategoryRequest request) {
        return ApiResponse.ok(categoryService.update(id, request));
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Activar / desactivar categoría")
    public ApiResponse<Void> toggleActive(@PathVariable UUID id) {
        categoryService.toggleActive(id);
        return ApiResponse.ok(null);
    }
}
