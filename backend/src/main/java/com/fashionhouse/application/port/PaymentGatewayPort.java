package com.fashionhouse.application.port;

import java.math.BigDecimal;
import java.util.UUID;

public interface PaymentGatewayPort {

    PaymentResult process(UUID orderId, BigDecimal amount, String currency, String method);

    record PaymentResult(
        boolean success,
        String gatewayReference,
        String rawResponse
    ) {}
}
