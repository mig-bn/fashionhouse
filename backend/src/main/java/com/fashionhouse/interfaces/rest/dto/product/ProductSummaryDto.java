package com.fashionhouse.interfaces.rest.dto.product;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ProductSummaryDto(
        UUID id,
        String name,
        String slug,
        BigDecimal basePrice,
        String currency,
        boolean isFeatured,
        boolean isActive,
        String categoryName,
        String primaryImageUrl
) {}
