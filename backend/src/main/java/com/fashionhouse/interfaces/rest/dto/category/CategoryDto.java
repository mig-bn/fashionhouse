package com.fashionhouse.interfaces.rest.dto.category;

import java.util.List;
import java.util.UUID;

public record CategoryDto(
        UUID id,
        String name,
        String slug,
        String description,
        UUID parentId,
        boolean isActive,
        int sortOrder,
        List<CategoryDto> children
) {}
