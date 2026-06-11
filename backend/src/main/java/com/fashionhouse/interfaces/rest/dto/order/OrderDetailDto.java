package com.fashionhouse.interfaces.rest.dto.order;

import com.fashionhouse.domain.model.order.OrderStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record OrderDetailDto(
        UUID id,
        OrderStatus status,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal tax,
        BigDecimal shippingCost,
        BigDecimal total,
        String currency,
        String shipAddress,
        String shipCity,
        String shipState,
        String shipPostal,
        String shipCountry,
        String notes,
        List<OrderItemDto> items,
        List<PaymentDto> payments,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
