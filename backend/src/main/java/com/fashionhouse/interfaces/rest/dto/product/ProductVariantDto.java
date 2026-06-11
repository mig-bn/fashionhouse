package com.fashionhouse.interfaces.rest.dto.product;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductVariantDto(
        UUID id,
        String sku,
        String size,
        String color,
        BigDecimal priceOverride,
        int stockQuantity,
        boolean isActive
) {}
