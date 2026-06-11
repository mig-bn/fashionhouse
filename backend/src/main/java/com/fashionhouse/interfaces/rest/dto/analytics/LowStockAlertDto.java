package com.fashionhouse.interfaces.rest.dto.analytics;

public record LowStockAlertDto(
    String sku,
    String productName,
    String size,
    String color,
    int stockQuantity
) {}
