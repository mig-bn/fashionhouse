package com.fashionhouse.interfaces.rest.dto.product;

import java.util.UUID;

public record ProductImageDto(
        UUID id,
        String url,
        String altText,
        int sortOrder,
        boolean isPrimary,
        UUID variantId
) {}
