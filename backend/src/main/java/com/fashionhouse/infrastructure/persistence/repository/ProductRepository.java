package com.fashionhouse.infrastructure.persistence.repository;

import com.fashionhouse.infrastructure.persistence.entity.ProductEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<ProductEntity, UUID>, JpaSpecificationExecutor<ProductEntity> {
    Optional<ProductEntity> findBySlug(String slug);
    Page<ProductEntity> findByActiveTrue(Pageable pageable);
    List<ProductEntity> findByCategoryIdAndActiveTrue(UUID categoryId);
    List<ProductEntity> findByFeaturedTrueAndActiveTrue();
}
