package com.fashionhouse.interfaces.rest.dto.customer;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CustomerSummaryDto(
    UUID id,
    String firstName,
    String lastName,
    String email,
    String phone,
    boolean trustedClient,
    long orderCount,
    long quotationCount,
    BigDecimal lifetimeValue,
    OffsetDateTime lastOrderAt,
    String[] internalTags,
    OffsetDateTime createdAt
) {}
