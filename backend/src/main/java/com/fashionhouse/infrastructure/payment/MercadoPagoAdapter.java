package com.fashionhouse.infrastructure.payment;

import com.fashionhouse.application.port.PaymentGatewayPort;
import com.fashionhouse.infrastructure.persistence.entity.OrderEntity;
import com.fashionhouse.infrastructure.persistence.entity.OrderItemEntity;
import com.fashionhouse.interfaces.rest.dto.payment.PaymentPreferenceResponse;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.preference.*;
import com.mercadopago.resources.preference.Preference;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
public class MercadoPagoAdapter implements PaymentGatewayPort {

    @Value("${mercadopago.access-token}")
    private String accessToken;

    @Value("${mercadopago.notification-url}")
    private String notificationUrl;

    @Value("${mercadopago.success-url}")
    private String successUrl;

    @Value("${mercadopago.failure-url}")
    private String failureUrl;

    @Value("${mercadopago.pending-url}")
    private String pendingUrl;

    @PostConstruct
    void init() {
        MercadoPagoConfig.setAccessToken(accessToken);
    }

    @Override
    public PaymentResult process(UUID orderId, BigDecimal amount, String currency, String method) {
        // Este método se usa para pagos directos; para MercadoPago usamos preferencias (checkout redirect).
        log.info("Proceso directo no soportado en MercadoPago — usar createPreference(). orderId={}", orderId);
        return new PaymentResult(false, null, "{\"error\":\"use_preference\"}");
    }

    public PaymentPreferenceResponse createPreference(OrderEntity order, List<OrderItemEntity> items) {
        try {
            PreferenceClient client = new PreferenceClient();

            List<PreferenceItemRequest> mpItems = items.stream().map(item ->
                    PreferenceItemRequest.builder()
                            .id(item.getVariant().getSku())
                            .title(item.getProductName() + " (" + item.getVariantSku() + ")")
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .currencyId(order.getCurrency())
                            .build()
            ).toList();

            PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                    .success(successUrl + "/" + order.getId() + "?status=approved")
                    .failure(failureUrl + "?orderId=" + order.getId())
                    .pending(pendingUrl + "?orderId=" + order.getId())
                    .build();

            PreferenceRequest preferenceRequest = PreferenceRequest.builder()
                    .items(mpItems)
                    .backUrls(backUrls)
                    .notificationUrl(notificationUrl)
                    .externalReference(order.getId().toString())
                    .autoReturn("approved")
                    .build();

            Preference preference = client.create(preferenceRequest);

            return new PaymentPreferenceResponse(
                    order.getId(),
                    preference.getId(),
                    preference.getInitPoint(),
                    preference.getSandboxInitPoint()
            );
        } catch (Exception e) {
            log.error("Error creando preferencia MercadoPago para orden {}: {}", order.getId(), e.getMessage());
            throw new RuntimeException("Error al crear preferencia de pago: " + e.getMessage(), e);
        }
    }
}
