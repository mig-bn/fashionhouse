package com.fashionhouse.application.service;

import com.fashionhouse.domain.exception.OrderStateException;
import com.fashionhouse.domain.exception.ResourceNotFoundException;
import com.fashionhouse.domain.model.order.OrderStatus;
import com.fashionhouse.infrastructure.persistence.entity.*;
import com.fashionhouse.infrastructure.persistence.repository.*;
import com.fashionhouse.interfaces.rest.dto.order.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CustomerRepository customerRepository;
    private final ProductVariantRepository variantRepository;
    private final PaymentRepository paymentRepository;
    private final InventoryService inventoryService;

    @Transactional
    public OrderDetailDto createOrder(CreateOrderRequest request) {
        CustomerEntity customer = resolveCurrentCustomer();

        // Construir la orden sin items primero para tener el ID
        OrderEntity order = OrderEntity.builder()
                .customer(customer)
                .status(OrderStatus.PENDING)
                .subtotal(BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .currency("MXN")
                .shipAddress(request.shipAddress())
                .shipCity(request.shipCity())
                .shipState(request.shipState())
                .shipPostal(request.shipPostal())
                .shipCountry(request.shipCountry() != null ? request.shipCountry() : "MX")
                .notes(request.notes())
                .build();
        order = orderRepository.save(order);

        BigDecimal subtotal = BigDecimal.ZERO;
        for (CreateOrderRequest.OrderLineRequest line : request.items()) {
            ProductVariantEntity variant = variantRepository.findById(line.variantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Variante", line.variantId().toString()));

            // Deducir stock de inmediato al crear la orden
            inventoryService.deductStock(variant, line.quantity(), order);

            BigDecimal unitPrice = variant.getPriceOverride() != null
                    ? variant.getPriceOverride()
                    : variant.getProduct().getBasePrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(line.quantity()));

            OrderItemEntity item = OrderItemEntity.builder()
                    .order(order)
                    .variant(variant)
                    .productName(variant.getProduct().getName())
                    .variantSku(variant.getSku())
                    .unitPrice(unitPrice)
                    .quantity(line.quantity())
                    .lineTotal(lineTotal)
                    .build();
            orderItemRepository.save(item);
            subtotal = subtotal.add(lineTotal);
        }

        order.setSubtotal(subtotal);
        order.setTotal(subtotal);
        order = orderRepository.save(order);

        return toDetail(order);
    }

    @Transactional(readOnly = true)
    public OrderDetailDto findById(UUID orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Orden", orderId.toString()));
        return toDetail(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderSummaryDto> findMyOrders(Pageable pageable) {
        CustomerEntity customer = resolveCurrentCustomer();
        return orderRepository.findByCustomerId(customer.getId(), pageable)
                .map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public Page<OrderSummaryDto> findAll(Pageable pageable) {
        return orderRepository.findAll(pageable).map(this::toSummary);
    }

    @Transactional
    public OrderDetailDto updateStatus(UUID orderId, OrderStatus newStatus) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Orden", orderId.toString()));

        if (!order.getStatus().canTransitionTo(newStatus)) {
            throw new OrderStateException(order.getStatus().name(), newStatus.name());
        }
        order.setStatus(newStatus);
        return toDetail(orderRepository.save(order));
    }

    // ── Mapeo ─────────────────────────────────────────────────────────────────

    private OrderDetailDto toDetail(OrderEntity o) {
        List<OrderItemDto> items = orderItemRepository.findByOrderId(o.getId()).stream()
                .map(i -> new OrderItemDto(
                        i.getId(), i.getVariant().getId(),
                        i.getProductName(), i.getVariantSku(),
                        i.getVariant().getSize(), i.getVariant().getColor(),
                        i.getUnitPrice(), i.getQuantity(), i.getLineTotal()
                ))
                .toList();

        List<PaymentDto> payments = paymentRepository.findByOrderId(o.getId()).stream()
                .map(p -> new PaymentDto(p.getId(), p.getAmount(), p.getCurrency(),
                        p.getMethod(), p.getStatus(), p.getGatewayReference(), p.getPaidAt()))
                .toList();

        return new OrderDetailDto(
                o.getId(), o.getStatus(), o.getSubtotal(), o.getDiscount(),
                o.getTax(), o.getShippingCost(), o.getTotal(), o.getCurrency(),
                o.getShipAddress(), o.getShipCity(), o.getShipState(),
                o.getShipPostal(), o.getShipCountry(), o.getNotes(),
                items, payments, o.getCreatedAt(), o.getUpdatedAt()
        );
    }

    private OrderSummaryDto toSummary(OrderEntity o) {
        int itemCount = orderItemRepository.findByOrderId(o.getId()).size();
        return new OrderSummaryDto(o.getId(), o.getStatus(), o.getTotal(),
                o.getCurrency(), itemCount, o.getCreatedAt());
    }

    private CustomerEntity resolveCurrentCustomer() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return customerRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de cliente", email));
    }
}
