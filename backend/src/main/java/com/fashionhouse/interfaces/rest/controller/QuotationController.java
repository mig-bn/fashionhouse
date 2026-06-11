package com.fashionhouse.interfaces.rest.controller;

import com.fashionhouse.application.service.QuotationService;
import com.fashionhouse.domain.model.quotation.QuotationStatus;
import com.fashionhouse.interfaces.rest.dto.ApiResponse;
import com.fashionhouse.interfaces.rest.dto.quotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/quotations")
@RequiredArgsConstructor
@Tag(name = "Quotations", description = "Gestión de cotizaciones a la medida")
@SecurityRequirement(name = "bearerAuth")
public class QuotationController {

    private final QuotationService quotationService;

    // ── Customer endpoints ─────────────────────────────────────────────────────

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'STAFF', 'TRUSTED_CLIENT')")
    @Operation(summary = "Crear solicitud de cotización")
    public ApiResponse<QuotationDetailDto> create(
            @Valid @RequestBody CreateQuotationRequest request) {
        return ApiResponse.ok(quotationService.createQuotation(request));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'STAFF', 'TRUSTED_CLIENT')")
    @Operation(summary = "Mis cotizaciones")
    public ApiResponse<Page<QuotationSummaryDto>> myQuotations(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        Page<QuotationSummaryDto> page = quotationService.findMyQuotations(pageable);
        return ApiResponse.ok(page, new ApiResponse.PageMeta(
                page.getNumber(), page.getTotalPages(), page.getTotalElements()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Detalle de cotización")
    public ApiResponse<QuotationDetailDto> getById(@PathVariable UUID id) {
        return ApiResponse.ok(quotationService.findById(id));
    }

    @PostMapping("/{id}/messages")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Agregar mensaje a una cotización")
    public ApiResponse<QuotationDetailDto> addMessage(
            @PathVariable UUID id,
            @Valid @RequestBody AddMessageRequest request) {
        return ApiResponse.ok(quotationService.addMessage(id, request));
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Subir imagen de referencia")
    public ApiResponse<QuotationDetailDto> uploadImage(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ApiResponse.ok(quotationService.uploadImage(id, file));
    }

    // ── Admin endpoints ────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Listar todas las cotizaciones (admin)")
    public ApiResponse<Page<QuotationSummaryDto>> listAll(
            @RequestParam(required = false) QuotationStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        Page<QuotationSummaryDto> page = status != null
                ? quotationService.findByStatus(status, pageable)
                : quotationService.findAll(pageable);
        return ApiResponse.ok(page, new ApiResponse.PageMeta(
                page.getNumber(), page.getTotalPages(), page.getTotalElements()));
    }

    @PatchMapping("/{id}/respond")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Responder / cambiar estado de cotización (admin)")
    public ApiResponse<QuotationDetailDto> respond(
            @PathVariable UUID id,
            @Valid @RequestBody RespondQuotationRequest request) {
        return ApiResponse.ok(quotationService.respond(id, request));
    }
}
