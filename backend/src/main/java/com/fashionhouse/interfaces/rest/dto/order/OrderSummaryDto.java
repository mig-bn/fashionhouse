package com.fashionhouse.interfaces.rest.dto.order;

import com.fashionhouse.domain.model.order.OrderStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record OrderSummaryDto(
        UUID id,
        OrderStatus status,
        BigDecimal total,
        String currency,
        int itemCount,
        OffsetDateTime createdAt
) {}
