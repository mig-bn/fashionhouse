package com.fashionhouse.interfaces.rest.dto.payment;

import java.util.UUID;

public record PaymentPreferenceResponse(
        UUID orderId,
        String preferenceId,
        String initPoint,
        String sandboxInitPoint
) {}
