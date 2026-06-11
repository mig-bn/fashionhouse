package com.fashionhouse.interfaces.rest.dto.analytics;

import java.math.BigDecimal;

public record RevenueByCategoryDto(
    String categoryName,
    BigDecimal revenue,
    long orderCount
) {}
