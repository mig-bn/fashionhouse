package com.fashionhouse.interfaces.rest.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateProductRequest(
        @NotNull(message = "La categoría es requerida")
        UUID categoryId,

        @NotBlank(message = "El nombre es requerido")
        String name,

        String slug,
        String description,

        @NotNull(message = "El precio base es requerido")
        @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor a cero")
        BigDecimal basePrice,

        String currency,
        boolean isFeatured
) {}
