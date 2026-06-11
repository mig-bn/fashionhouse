package com.fashionhouse.interfaces.rest.dto.quotation;

import com.fashionhouse.domain.model.quotation.QuotationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record RespondQuotationRequest(
    @NotNull QuotationStatus newStatus,
    BigDecimal proposedPrice,
    String currency,
    LocalDate estimatedDelivery,
    @Size(max = 2000) String adminNotes,
    @Size(max = 1000) String rejectionReason,
    @Size(max = 2000) String message
) {}
