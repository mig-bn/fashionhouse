package com.fashionhouse.interfaces.rest.dto.quotation;

import com.fashionhouse.domain.model.quotation.QuotationStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record QuotationSummaryDto(
    UUID id,
    UUID customerId,
    String customerName,
    String description,
    QuotationStatus status,
    BigDecimal proposedPrice,
    String currency,
    LocalDate estimatedDelivery,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
