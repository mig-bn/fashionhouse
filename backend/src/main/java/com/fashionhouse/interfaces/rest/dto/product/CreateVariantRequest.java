package com.fashionhouse.interfaces.rest.dto.product;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record CreateVariantRequest(
        @NotBlank(message = "El SKU es requerido")
        String sku,

        String size,
        String color,
        BigDecimal priceOverride,

        @Min(value = 0, message = "El stock no puede ser negativo")
        int stockQuantity
) {}
