package com.fashionhouse.interfaces.rest.controller;

import com.fashionhouse.application.service.ProductService;
import com.fashionhouse.interfaces.rest.dto.ApiResponse;
import com.fashionhouse.interfaces.rest.dto.product.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Productos", description = "Catálogo público y gestión admin de productos")
public class ProductController {

    private final ProductService productService;

    // ── Catálogo público ──────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Catálogo con filtros y paginación")
    public ApiResponse<List<ProductSummaryDto>> catalog(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, pageSize, Sort.by(dir, sort));
        Page<ProductSummaryDto> result = productService.findCatalog(
                categoryId, minPrice, maxPrice, size, color, featured, pageable);

        return ApiResponse.ok(result.getContent(),
                new ApiResponse.PageMeta(result.getNumber(), result.getTotalPages(), result.getTotalElements()));
    }

    @GetMapping("/featured")
    @Operation(summary = "Productos destacados")
    public ApiResponse<List<ProductSummaryDto>> featured() {
        return ApiResponse.ok(productService.findFeatured());
    }

    // ── Admin: listado y detalle por ID ───────────────────────────────────────

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Todos los productos (admin, incluye inactivos)")
    public ApiResponse<List<ProductSummaryDto>> listAllAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int pageSize) {
        var pageable = PageRequest.of(page, pageSize,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = productService.findAllAdmin(pageable);
        return ApiResponse.ok(result.getContent(),
                new ApiResponse.PageMeta(result.getNumber(), result.getTotalPages(), result.getTotalElements()));
    }

    @GetMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Detalle de producto por ID (admin)")
    public ApiResponse<ProductDetailDto> getByIdAdmin(@PathVariable UUID id) {
        return ApiResponse.ok(productService.findById(id));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Detalle de producto por slug")
    public ApiResponse<ProductDetailDto> getBySlug(@PathVariable String slug) {
        return ApiResponse.ok(productService.findBySlug(slug));
    }

    // ── Admin: CRUD ───────────────────────────────────────────────────────────

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Crear producto")
    public ApiResponse<ProductDetailDto> create(@Valid @RequestBody CreateProductRequest request) {
        return ApiResponse.ok(productService.create(request));
    }

    @PostMapping("/{id}/variants")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Agregar variante a producto")
    public ApiResponse<ProductVariantDto> addVariant(
            @PathVariable UUID id,
            @Valid @RequestBody CreateVariantRequest request) {
        return ApiResponse.ok(productService.addVariant(id, request));
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Subir imagen de producto a MinIO")
    public ApiResponse<ProductImageDto> uploadImage(
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file,
            @RequestParam(defaultValue = "false") boolean isPrimary) {
        return ApiResponse.ok(productService.uploadImage(id, file, isPrimary));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Actualizar producto")
    public ApiResponse<ProductDetailDto> update(
            @PathVariable UUID id,
            @RequestBody CreateProductRequest request) {
        return ApiResponse.ok(productService.update(id, request));
    }

    @DeleteMapping("/{productId}/variants/{variantId}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Eliminar variante")
    public ApiResponse<Void> deleteVariant(
            @PathVariable UUID productId,
            @PathVariable UUID variantId) {
        productService.deleteVariant(productId, variantId);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{productId}/images/{imageId}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Eliminar imagen")
    public ApiResponse<Void> deleteImage(
            @PathVariable UUID productId,
            @PathVariable UUID imageId) {
        productService.deleteImage(productId, imageId);
        return ApiResponse.ok(null);
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @Operation(summary = "Activar / desactivar producto")
    public ApiResponse<Void> toggleActive(@PathVariable UUID id) {
        productService.toggleActive(id);
        return ApiResponse.ok(null);
    }
}
