package com.fashionhouse.infrastructure.persistence.repository;

import com.fashionhouse.infrastructure.persistence.entity.InventoryMovementEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovementEntity, UUID> {
    Page<InventoryMovementEntity> findByVariantIdOrderByCreatedAtDesc(UUID variantId, Pageable pageable);
}
