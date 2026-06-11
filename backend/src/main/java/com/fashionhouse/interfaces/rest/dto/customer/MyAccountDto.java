package com.fashionhouse.interfaces.rest.dto.customer;

import com.fashionhouse.interfaces.rest.dto.order.OrderSummaryDto;
import com.fashionhouse.interfaces.rest.dto.quotation.QuotationSummaryDto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MyAccountDto(
    UUID customerId,
    String firstName,
    String lastName,
    String email,
    String phone,
    String whatsappPhone,
    LocalDate birthDate,
    boolean trustedClient,
    int loyaltyPoints,
    long totalOrders,
    long activeQuotations,
    BigDecimal totalSpent,
    List<OrderSummaryDto> recentOrders,
    List<QuotationSummaryDto> activeQuotationList
) {}
