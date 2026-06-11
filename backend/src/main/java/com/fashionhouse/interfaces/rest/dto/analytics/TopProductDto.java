package com.fashionhouse.interfaces.rest.dto.analytics;

import java.math.BigDecimal;

public record TopProductDto(
    String productName,
    long unitsSold,
    BigDecimal revenue
) {}
