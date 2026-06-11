package com.fashionhouse.interfaces.rest.dto.customer;

import com.fashionhouse.interfaces.rest.dto.order.OrderSummaryDto;
import com.fashionhouse.interfaces.rest.dto.quotation.QuotationSummaryDto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CustomerDetailDto(
    UUID id,
    String firstName,
    String lastName,
    String email,
    String phone,
    String whatsappPhone,
    LocalDate birthDate,
    String addressLine,
    String city,
    String state,
    String postalCode,
    String country,
    boolean trustedClient,
    int loyaltyPoints,
    String[] internalTags,
    long orderCount,
    long quotationCount,
    BigDecimal lifetimeValue,
    OffsetDateTime lastOrderAt,
    List<OrderSummaryDto> recentOrders,
    List<QuotationSummaryDto> recentQuotations,
    List<CustomerNoteDto> notes,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
