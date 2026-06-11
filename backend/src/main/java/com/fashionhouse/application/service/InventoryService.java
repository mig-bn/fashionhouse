package com.fashionhouse.application.service;

import com.fashionhouse.domain.exception.InsufficientStockException;
import com.fashionhouse.domain.model.inventory.MovementType;
import com.fashionhouse.infrastructure.persistence.entity.InventoryMovementEntity;
import com.fashionhouse.infrastructure.persistence.entity.OrderEntity;
import com.fashionhouse.infrastructure.persistence.entity.ProductVariantEntity;
import com.fashionhouse.infrastructure.persistence.entity.UserEntity;
import com.fashionhouse.infrastructure.persistence.repository.InventoryMovementRepository;
import com.fashionhouse.infrastructure.persistence.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductVariantRepository variantRepository;
    private final InventoryMovementRepository movementRepository;

    @Transactional
    public void deductStock(ProductVariantEntity variant, int quantity, OrderEntity order) {
        int stockBefore = variant.getStockQuantity();
        if (stockBefore < quantity) {
            throw new InsufficientStockException(variant.getSku(), quantity, stockBefore);
        }

        int stockAfter = stockBefore - quantity;
        variant.setStockQuantity(stockAfter);
        variantRepository.save(variant);

        InventoryMovementEntity movement = InventoryMovementEntity.builder()
                .variant(variant)
                .order(order)
                .type(MovementType.OUT)
                .quantity(quantity)
                .stockBefore(stockBefore)
                .stockAfter(stockAfter)
                .reason("Venta confirmada")
                .build();
        movementRepository.save(movement);
    }

    @Transactional
    public void returnStock(ProductVariantEntity variant, int quantity, OrderEntity order, UserEntity actor) {
        int stockBefore = variant.getStockQuantity();
        int stockAfter = stockBefore + quantity;
        variant.setStockQuantity(stockAfter);
        variantRepository.save(variant);

        InventoryMovementEntity movement = InventoryMovementEntity.builder()
                .variant(variant)
                .order(order)
                .type(MovementType.RETURN)
                .quantity(quantity)
                .stockBefore(stockBefore)
                .stockAfter(stockAfter)
                .reason("Devolución / cancelación de orden")
                .createdBy(actor)
                .build();
        movementRepository.save(movement);
    }

    @Transactional
    public void adjust(ProductVariantEntity variant, int newStock, String reason, UserEntity actor) {
        int stockBefore = variant.getStockQuantity();
        variant.setStockQuantity(newStock);
        variantRepository.save(variant);

        InventoryMovementEntity movement = InventoryMovementEntity.builder()
                .variant(variant)
                .type(MovementType.ADJUSTMENT)
                .quantity(Math.abs(newStock - stockBefore))
                .stockBefore(stockBefore)
                .stockAfter(newStock)
                .reason(reason)
                .createdBy(actor)
                .build();
        movementRepository.save(movement);
    }
}
