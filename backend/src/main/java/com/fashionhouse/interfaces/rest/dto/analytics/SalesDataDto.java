package com.fashionhouse.interfaces.rest.dto.analytics;

import java.math.BigDecimal;

public record SalesDataDto(
    String date,
    BigDecimal revenue,
    long orderCount
) {}
