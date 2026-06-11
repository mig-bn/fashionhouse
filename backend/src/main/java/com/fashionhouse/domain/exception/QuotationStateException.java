package com.fashionhouse.domain.exception;

public class QuotationStateException extends DomainException {

    public QuotationStateException(String currentStatus, String targetStatus) {
        super(String.format(
            "Transición de estado no permitida: %s -> %s",
            currentStatus, targetStatus
        ));
    }
}
