package com.fashionhouse.interfaces.rest.controller;

import com.fashionhouse.application.service.AnalyticsService;
import com.fashionhouse.interfaces.rest.dto.ApiResponse;
import com.fashionhouse.interfaces.rest.dto.analytics.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
@Tag(name = "Analytics", description = "KPIs y reportes del panel admin")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    @Operation(summary = "KPIs del dashboard")
    public ApiResponse<DashboardSummaryDto> summary() {
        return ApiResponse.ok(analyticsService.getDashboardSummary());
    }

    @GetMapping("/sales")
    @Operation(summary = "Ventas por período")
    public ApiResponse<List<SalesDataDto>> sales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate resolvedFrom = from != null ? from : LocalDate.now().minusDays(29);
        LocalDate resolvedTo   = to   != null ? to   : LocalDate.now();
        return ApiResponse.ok(analyticsService.getSalesByPeriod(resolvedFrom, resolvedTo));
    }

    @GetMapping("/top-products")
    @Operation(summary = "Top 10 productos más vendidos")
    public ApiResponse<List<TopProductDto>> topProducts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate resolvedFrom = from != null ? from : LocalDate.now().minusDays(29);
        LocalDate resolvedTo   = to   != null ? to   : LocalDate.now();
        return ApiResponse.ok(analyticsService.getTopProducts(resolvedFrom, resolvedTo));
    }

    @GetMapping("/conversion")
    @Operation(summary = "Tasa de conversión cotizaciones → órdenes")
    public ApiResponse<ConversionRateDto> conversion() {
        return ApiResponse.ok(analyticsService.getQuotationConversionRate());
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Alertas de bajo inventario (stock < 5)")
    public ApiResponse<List<LowStockAlertDto>> lowStock() {
        return ApiResponse.ok(analyticsService.getLowStockAlerts());
    }

    @GetMapping("/revenue-category")
    @Operation(summary = "Revenue por categoría")
    public ApiResponse<List<RevenueByCategoryDto>> revenueByCategory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate resolvedFrom = from != null ? from : LocalDate.now().minusDays(29);
        LocalDate resolvedTo   = to   != null ? to   : LocalDate.now();
        return ApiResponse.ok(analyticsService.getRevenueByCategory(resolvedFrom, resolvedTo));
    }
}
