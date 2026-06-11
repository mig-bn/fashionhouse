package com.fashionhouse.application.service;

import com.fashionhouse.application.port.StoragePort;
import com.fashionhouse.domain.exception.ResourceNotFoundException;
import com.fashionhouse.infrastructure.persistence.entity.*;
import com.fashionhouse.infrastructure.persistence.repository.*;
import com.fashionhouse.interfaces.rest.dto.category.CategoryDto;
import com.fashionhouse.interfaces.rest.dto.product.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductImageRepository imageRepository;
    private final CategoryRepository categoryRepository;
    private final StoragePort storagePort;

    @Value("${minio.bucket-products}")
    private String bucket;

    // ── Catálogo público ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ProductSummaryDto> findCatalog(
            UUID categoryId, BigDecimal minPrice, BigDecimal maxPrice,
            String size, String color, Boolean featured, Pageable pageable) {

        var spec = ProductSpecification.withFilters(categoryId, minPrice, maxPrice, size, color, featured);
        return productRepository.findAll(spec, pageable).map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public ProductDetailDto findBySlug(String slug) {
        ProductEntity p = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", slug));
        return toDetail(p);
    }

    @Transactional(readOnly = true)
    public ProductDetailDto findById(UUID id) {
        return productRepository.findById(id)
                .map(this::toDetail)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", id.toString()));
    }

    @Transactional(readOnly = true)
    public List<ProductSummaryDto> findFeatured() {
        return productRepository.findByFeaturedTrueAndActiveTrue().stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<ProductSummaryDto> findAllAdmin(Pageable pageable) {
        return productRepository.findAll(pageable).map(this::toSummary);
    }

    // ── Admin: CRUD ───────────────────────────────────────────────────────────

    @Transactional
    public ProductDetailDto create(CreateProductRequest request) {
        CategoryEntity category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoría", request.categoryId().toString()));

        String slug = request.slug() != null && !request.slug().isBlank()
                ? request.slug()
                : slugify(request.name());

        if (productRepository.findBySlug(slug).isPresent()) {
            throw new IllegalArgumentException("Ya existe un producto con ese slug: " + slug);
        }

        ProductEntity entity = ProductEntity.builder()
                .category(category)
                .name(request.name())
                .slug(slug)
                .description(request.description())
                .basePrice(request.basePrice())
                .currency(request.currency() != null ? request.currency() : "MXN")
                .featured(request.isFeatured())
                .active(true)
                .build();

        return toDetail(productRepository.save(entity));
    }

    @Transactional
    public ProductVariantDto addVariant(UUID productId, CreateVariantRequest request) {
        ProductEntity product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", productId.toString()));

        if (variantRepository.findBySku(request.sku()).isPresent()) {
            throw new IllegalArgumentException("El SKU ya existe: " + request.sku());
        }

        ProductVariantEntity variant = ProductVariantEntity.builder()
                .product(product)
                .sku(request.sku())
                .size(request.size())
                .color(request.color())
                .priceOverride(request.priceOverride())
                .stockQuantity(request.stockQuantity())
                .active(true)
                .build();

        ProductVariantEntity saved = variantRepository.save(variant);
        return toVariantDto(saved);
    }

    @Transactional
    public ProductImageDto uploadImage(UUID productId, MultipartFile file, boolean isPrimary) {
        ProductEntity product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", productId.toString()));

        String objectName = "products/" + productId + "/" + UUID.randomUUID() + "-" + file.getOriginalFilename();
        String url;
        try {
            url = storagePort.upload(bucket, objectName, file.getInputStream(),
                    file.getSize(), file.getContentType());
        } catch (Exception e) {
            throw new RuntimeException("Error al subir imagen: " + e.getMessage(), e);
        }

        if (isPrimary) {
            // Quitar flag de primary a las demás imágenes del producto
            imageRepository.findByProductIdOrderBySortOrderAsc(productId)
                    .forEach(img -> {
                        img.setPrimary(false);
                        imageRepository.save(img);
                    });
        }

        int nextOrder = imageRepository.findByProductIdOrderBySortOrderAsc(productId).size();
        ProductImageEntity image = ProductImageEntity.builder()
                .product(product)
                .url(url)
                .altText(product.getName())
                .sortOrder(nextOrder)
                .primary(isPrimary)
                .build();

        return toImageDto(imageRepository.save(image));
    }

    @Transactional
    public ProductDetailDto update(UUID id, CreateProductRequest request) {
        ProductEntity entity = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", id.toString()));

        if (request.categoryId() != null) {
            CategoryEntity category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoría", request.categoryId().toString()));
            entity.setCategory(category);
        }
        if (request.name() != null) entity.setName(request.name());
        if (request.slug() != null && !request.slug().isBlank()) entity.setSlug(request.slug());
        if (request.description() != null) entity.setDescription(request.description());
        if (request.basePrice() != null) entity.setBasePrice(request.basePrice());
        if (request.currency() != null) entity.setCurrency(request.currency());
        entity.setFeatured(request.isFeatured());

        return toDetail(productRepository.save(entity));
    }

    @Transactional
    public void deleteVariant(UUID productId, UUID variantId) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variante", variantId.toString()));
        if (!variant.getProduct().getId().equals(productId)) {
            throw new IllegalArgumentException("La variante no pertenece al producto");
        }
        variantRepository.delete(variant);
    }

    @Transactional
    public void deleteImage(UUID productId, UUID imageId) {
        ProductImageEntity image = imageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Imagen", imageId.toString()));
        if (!image.getProduct().getId().equals(productId)) {
            throw new IllegalArgumentException("La imagen no pertenece al producto");
        }
        // Remove from storage (best effort)
        try {
            String url = image.getUrl();
            // Extract object name from URL: everything after /products/
            int idx = url.indexOf("/products/");
            if (idx >= 0) {
                String objectName = "products/" + url.substring(idx + "/products/".length());
                storagePort.delete(bucket, objectName);
            }
        } catch (Exception e) {
            // Log but don't fail - file might not exist in storage
        }
        imageRepository.delete(image);
    }

    @Transactional
    public void toggleActive(UUID id) {
        ProductEntity entity = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", id.toString()));
        entity.setActive(!entity.isActive());
        productRepository.save(entity);
    }

    // ── Mapeo ─────────────────────────────────────────────────────────────────

    public ProductSummaryDto toSummary(ProductEntity p) {
        String primaryUrl = p.getImages().stream()
                .filter(ProductImageEntity::isPrimary)
                .findFirst()
                .or(() -> p.getImages().stream().findFirst())
                .map(ProductImageEntity::getUrl)
                .orElse(null);

        return new ProductSummaryDto(
                p.getId(), p.getName(), p.getSlug(), p.getBasePrice(), p.getCurrency(),
                p.isFeatured(), p.isActive(), p.getCategory().getName(), primaryUrl
        );
    }

    public ProductDetailDto toDetail(ProductEntity p) {
        CategoryEntity cat = p.getCategory();
        CategoryDto categoryDto = new CategoryDto(
                cat.getId(), cat.getName(), cat.getSlug(), cat.getDescription(),
                cat.getParent() != null ? cat.getParent().getId() : null,
                cat.isActive(), cat.getSortOrder(), List.of()
        );

        List<ProductVariantDto> variants = p.getVariants().stream()
                .map(this::toVariantDto).toList();
        List<ProductImageDto> images = p.getImages().stream()
                .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .map(this::toImageDto).toList();

        return new ProductDetailDto(
                p.getId(), p.getName(), p.getSlug(), p.getDescription(),
                p.getBasePrice(), p.getCurrency(), p.isFeatured(), p.isActive(),
                categoryDto, variants, images, p.getCreatedAt(), p.getUpdatedAt()
        );
    }

    private ProductVariantDto toVariantDto(ProductVariantEntity v) {
        return new ProductVariantDto(v.getId(), v.getSku(), v.getSize(), v.getColor(),
                v.getPriceOverride(), v.getStockQuantity(), v.isActive());
    }

    private ProductImageDto toImageDto(ProductImageEntity i) {
        return new ProductImageDto(i.getId(), i.getUrl(), i.getAltText(), i.getSortOrder(),
                i.isPrimary(), i.getVariant() != null ? i.getVariant().getId() : null);
    }

    private String slugify(String text) {
        return text.toLowerCase()
                .replaceAll("[áàäâ]", "a").replaceAll("[éèëê]", "e")
                .replaceAll("[íìïî]", "i").replaceAll("[óòöô]", "o")
                .replaceAll("[úùüû]", "u").replaceAll("ñ", "n")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-").replaceAll("-+", "-");
    }
}
