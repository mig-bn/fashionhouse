package com.fashionhouse.domain.model.order;

import java.util.Set;

public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    REFUNDED;

    public boolean canTransitionTo(OrderStatus target) {
        return allowedTransitions().contains(target);
    }

    private Set<OrderStatus> allowedTransitions() {
        return switch (this) {
            case PENDING    -> Set.of(CONFIRMED, CANCELLED);
            case CONFIRMED  -> Set.of(PROCESSING, CANCELLED);
            case PROCESSING -> Set.of(SHIPPED, CANCELLED);
            case SHIPPED    -> Set.of(DELIVERED);
            case DELIVERED  -> Set.of(REFUNDED);
            case CANCELLED  -> Set.of();
            case REFUNDED   -> Set.of();
        };
    }
}
