package com.fashionhouse.domain.exception;

public class ProductNotFoundException extends DomainException {

    public ProductNotFoundException(String id) {
        super("Producto no encontrado con id: " + id);
    }

    public ProductNotFoundException(String field, String value) {
        super("Producto no encontrado con " + field + ": " + value);
    }
}
