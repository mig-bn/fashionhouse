package com.fashionhouse.interfaces.rest.dto.order;

import com.fashionhouse.domain.model.order.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(
        @NotNull(message = "El estado es requerido")
        OrderStatus status
) {}
