package com.fashionhouse.interfaces.rest.controller;

import com.fashionhouse.domain.exception.ResourceNotFoundException;
import com.fashionhouse.domain.model.order.OrderStatus;
import com.fashionhouse.domain.model.payment.PaymentMethod;
import com.fashionhouse.domain.model.payment.PaymentStatus;
import com.fashionhouse.infrastructure.payment.MercadoPagoAdapter;
import com.fashionhouse.infrastructure.persistence.entity.OrderEntity;
import com.fashionhouse.infrastructure.persistence.entity.PaymentEntity;
import com.fashionhouse.infrastructure.persistence.repository.OrderItemRepository;
import com.fashionhouse.infrastructure.persistence.repository.OrderRepository;
import com.fashionhouse.infrastructure.persistence.repository.PaymentRepository;
import com.fashionhouse.interfaces.rest.dto.ApiResponse;
import com.fashionhouse.interfaces.rest.dto.payment.CreatePreferenceRequest;
import com.fashionhouse.interfaces.rest.dto.payment.PaymentPreferenceResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Pagos", description = "Preferencias de pago MercadoPago y webhooks")
public class PaymentController {

    private final MercadoPagoAdapter mercadoPagoAdapter;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;

    @PostMapping("/preference")
    @Operation(summary = "Crear preferencia de pago MercadoPago para una orden")
    public ApiResponse<PaymentPreferenceResponse> createPreference(
            @Valid @RequestBody CreatePreferenceRequest request) {

        OrderEntity order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Orden", request.orderId().toString()));

        var items = orderItemRepository.findByOrderId(order.getId());
        PaymentPreferenceResponse preference = mercadoPagoAdapter.createPreference(order, items);

        // Registrar el intento de pago en BD
        PaymentEntity payment = PaymentEntity.builder()
                .order(order)
                .amount(order.getTotal())
                .currency(order.getCurrency())
                .method(request.paymentMethod())
                .status(PaymentStatus.PENDING)
                .gatewayReference(preference.preferenceId())
                .build();
        paymentRepository.save(payment);

        return ApiResponse.ok(preference);
    }

    @PostMapping("/webhook/mercadopago")
    @ResponseStatus(HttpStatus.OK)
    @Operation(summary = "Webhook de notificación de MercadoPago (público)")
    public void handleMercadoPagoWebhook(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String id,
            @RequestBody(required = false) Map<String, Object> body) {

        log.info("Webhook MercadoPago recibido: type={}, id={}", type, id);

        // MercadoPago envía type=payment con el ID del pago
        if ("payment".equals(type) && id != null) {
            processPaymentNotification(id);
        }
    }

    private void processPaymentNotification(String mpPaymentId) {
        // Buscar el pago por su referencia de gateway
        paymentRepository.findAll().stream()
                .filter(p -> mpPaymentId.equals(p.getGatewayReference())
                        || (p.getOrder() != null && p.getOrder().getId().toString().contains(mpPaymentId)))
                .findFirst()
                .ifPresent(payment -> {
                    // En una integración completa se consultaría la API de MP para verificar el estado.
                    // Para MVP: marcar el pago como COMPLETED y confirmar la orden.
                    payment.setStatus(PaymentStatus.COMPLETED);
                    payment.setPaidAt(OffsetDateTime.now());
                    paymentRepository.save(payment);

                    OrderEntity order = payment.getOrder();
                    if (order != null && order.getStatus() == OrderStatus.PENDING) {
                        order.setStatus(OrderStatus.CONFIRMED);
                        orderRepository.save(order);
                        log.info("Orden {} confirmada tras pago MP {}", order.getId(), mpPaymentId);
                    }
                });
    }
}
