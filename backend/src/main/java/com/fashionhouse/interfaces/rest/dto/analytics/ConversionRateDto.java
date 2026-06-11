package com.fashionhouse.interfaces.rest.dto.analytics;

public record ConversionRateDto(
    long total,
    long accepted,
    long rejected,
    long pending,
    double conversionRate
) {}
