package com.fashionhouse.interfaces.rest.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CreateOrderRequest(
        @NotEmpty(message = "La orden debe tener al menos un artículo")
        @Valid
        List<OrderLineRequest> items,

        String shipAddress,
        String shipCity,
        String shipState,
        String shipPostal,
        String shipCountry,
        String notes
) {
    public record OrderLineRequest(
            @NotNull(message = "El ID de la variante es requerido")
            UUID variantId,

            @Min(value = 1, message = "La cantidad debe ser al menos 1")
            int quantity
    ) {}
}
