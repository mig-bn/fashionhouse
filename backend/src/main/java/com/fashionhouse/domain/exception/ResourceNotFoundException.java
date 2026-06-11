package com.fashionhouse.domain.exception;

public class ResourceNotFoundException extends DomainException {

    public ResourceNotFoundException(String resource, String id) {
        super(resource + " no encontrado con id: " + id);
    }
}
