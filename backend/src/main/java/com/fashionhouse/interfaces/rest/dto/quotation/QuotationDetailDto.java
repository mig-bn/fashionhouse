package com.fashionhouse.interfaces.rest.dto.quotation;

import com.fashionhouse.domain.model.quotation.QuotationStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record QuotationDetailDto(
    UUID id,
    UUID customerId,
    String customerName,
    String customerEmail,
    String description,
    String measurements,
    QuotationStatus status,
    BigDecimal proposedPrice,
    String currency,
    LocalDate estimatedDelivery,
    String adminNotes,
    String rejectionReason,
    List<QuotationMessageDto> messages,
    List<QuotationImageDto> images,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
