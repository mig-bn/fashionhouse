package com.fashionhouse.interfaces.rest.controller;

import com.fashionhouse.application.service.CustomerService;
import com.fashionhouse.interfaces.rest.dto.ApiResponse;
import com.fashionhouse.interfaces.rest.dto.customer.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Customers", description = "Gestión de clientes y CRM")
@SecurityRequirement(name = "bearerAuth")
public class CustomerController {

    private final CustomerService customerService;

    // ── Mi cuenta (cliente autenticado) ────────────────────────────────────────

    @GetMapping("/api/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mi cuenta — resumen y actividad reciente")
    public ApiResponse<MyAccountDto> getMyAccount() {
        return ApiResponse.ok(customerService.getMyAccount());
    }

    @PatchMapping("/api/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Actualizar mi perfil")
    public ApiResponse<MyAccountDto> updateMyProfile(
            @Valid @RequestBody UpdateCustomerRequest request) {
        return ApiResponse.ok(customerService.updateMyProfile(request));
    }

    // ── Admin: listado ─────────────────────────────────────────────────────────

    @GetMapping("/api/admin/customers")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Listar clientes (admin) — con métricas LTV")
    public ApiResponse<Page<CustomerSummaryDto>> listAll(
            @RequestParam(required = false) Boolean trustedOnly,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        Page<CustomerSummaryDto> page = customerService.findAll(trustedOnly, pageable);
        return ApiResponse.ok(page, new ApiResponse.PageMeta(
                page.getNumber(), page.getTotalPages(), page.getTotalElements()));
    }

    // ── Admin: detalle ─────────────────────────────────────────────────────────

    @GetMapping("/api/admin/customers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Perfil 360° del cliente (admin)")
    public ApiResponse<CustomerDetailDto> getById(@PathVariable UUID id) {
        return ApiResponse.ok(customerService.findById(id));
    }

    @PostMapping("/api/admin/customers/{id}/toggle-trusted")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Marcar/desmarcar como cliente de confianza")
    public ApiResponse<CustomerDetailDto> toggleTrusted(@PathVariable UUID id) {
        return ApiResponse.ok(customerService.toggleTrustedClient(id));
    }

    @PostMapping("/api/admin/customers/{id}/notes")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Agregar nota interna al cliente")
    public ApiResponse<CustomerDetailDto> addNote(
            @PathVariable UUID id,
            @Valid @RequestBody AddNoteRequest request) {
        return ApiResponse.ok(customerService.addNote(id, request));
    }

    @PatchMapping("/api/admin/customers/{id}/tags")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Actualizar etiquetas internas del cliente")
    public ApiResponse<CustomerDetailDto> updateTags(
            @PathVariable UUID id,
            @RequestBody List<String> tags) {
        return ApiResponse.ok(customerService.updateTags(id, tags));
    }

    @PatchMapping("/api/admin/customers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Actualizar perfil del cliente (admin)")
    public ApiResponse<CustomerDetailDto> updateProfile(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCustomerRequest request) {
        return ApiResponse.ok(customerService.updateProfile(id, request));
    }
}
