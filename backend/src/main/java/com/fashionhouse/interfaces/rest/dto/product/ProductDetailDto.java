package com.fashionhouse.interfaces.rest.dto.product;

import com.fashionhouse.interfaces.rest.dto.category.CategoryDto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ProductDetailDto(
        UUID id,
        String name,
        String slug,
        String description,
        BigDecimal basePrice,
        String currency,
        boolean isFeatured,
        boolean isActive,
        CategoryDto category,
        List<ProductVariantDto> variants,
        List<ProductImageDto> images,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
