package com.fashionhouse.infrastructure.persistence.repository;

import com.fashionhouse.infrastructure.persistence.entity.ProductVariantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariantEntity, UUID> {
    List<ProductVariantEntity> findByProductId(UUID productId);
    Optional<ProductVariantEntity> findBySku(String sku);
    List<ProductVariantEntity> findByProductIdAndActiveTrue(UUID productId);
}
