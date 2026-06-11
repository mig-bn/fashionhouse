package com.fashionhouse.interfaces.rest.dto.order;

import com.fashionhouse.domain.model.payment.PaymentMethod;
import com.fashionhouse.domain.model.payment.PaymentStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record PaymentDto(
        UUID id,
        BigDecimal amount,
        String currency,
        PaymentMethod method,
        PaymentStatus status,
        String gatewayReference,
        OffsetDateTime paidAt
) {}
