package com.fashionhouse.interfaces.rest.controller;

import com.fashionhouse.application.service.OrderService;
import com.fashionhouse.interfaces.rest.dto.ApiResponse;
import com.fashionhouse.interfaces.rest.dto.order.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Órdenes", description = "Creación y seguimiento de órdenes de compra")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear orden (checkout)")
    public ApiResponse<OrderDetailDto> create(@Valid @RequestBody CreateOrderRequest request) {
        return ApiResponse.ok(orderService.createOrder(request));
    }

    @GetMapping("/my")
    @Operation(summary = "Mis órdenes (cliente autenticado)")
    public ApiResponse<List<OrderSummaryDto>> myOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        var pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = orderService.findMyOrders(pageable);
        return ApiResponse.ok(result.getContent(),
                new ApiResponse.PageMeta(result.getNumber(), result.getTotalPages(), result.getTotalElements()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de orden por ID")
    public ApiResponse<OrderDetailDto> getById(@PathVariable UUID id) {
        return ApiResponse.ok(orderService.findById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Listar todas las órdenes (admin)")
    public ApiResponse<List<OrderSummaryDto>> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        var pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = orderService.findAll(pageable);
        return ApiResponse.ok(result.getContent(),
                new ApiResponse.PageMeta(result.getNumber(), result.getTotalPages(), result.getTotalElements()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Actualizar estado de orden (admin)")
    public ApiResponse<OrderDetailDto> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ApiResponse.ok(orderService.updateStatus(id, request.status()));
    }
}
