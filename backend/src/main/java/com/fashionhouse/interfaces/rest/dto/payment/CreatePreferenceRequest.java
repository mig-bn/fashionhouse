package com.fashionhouse.interfaces.rest.dto.payment;

import com.fashionhouse.domain.model.payment.PaymentMethod;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreatePreferenceRequest(
        @NotNull(message = "El ID de la orden es requerido")
        UUID orderId,

        @NotNull(message = "El método de pago es requerido")
        PaymentMethod paymentMethod
) {}
