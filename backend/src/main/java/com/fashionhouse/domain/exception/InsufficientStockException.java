package com.fashionhouse.domain.exception;

public class InsufficientStockException extends DomainException {

    public InsufficientStockException(String sku, int requested, int available) {
        super(String.format(
            "Stock insuficiente para SKU %s. Solicitado: %d, Disponible: %d",
            sku, requested, available
        ));
    }
}
