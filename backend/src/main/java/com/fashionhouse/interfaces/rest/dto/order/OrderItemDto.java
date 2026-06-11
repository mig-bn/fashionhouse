package com.fashionhouse.interfaces.rest.dto.order;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemDto(
        UUID id,
        UUID variantId,
        String productName,
        String variantSku,
        String size,
        String color,
        BigDecimal unitPrice,
        int quantity,
        BigDecimal lineTotal
) {}
