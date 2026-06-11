package com.fashionhouse.interfaces.rest.dto.category;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CreateCategoryRequest(
        @NotBlank(message = "El nombre es requerido")
        String name,

        String slug,
        String description,
        UUID parentId,
        int sortOrder
) {}
