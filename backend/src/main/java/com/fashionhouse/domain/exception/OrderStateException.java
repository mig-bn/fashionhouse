package com.fashionhouse.domain.exception;

public class OrderStateException extends DomainException {

    public OrderStateException(String currentStatus, String targetStatus) {
        super(String.format(
            "Transición de estado no permitida: %s -> %s",
            currentStatus, targetStatus
        ));
    }
}
