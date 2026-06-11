package com.fashionhouse.domain.model.quotation;

import java.util.Set;

public enum QuotationStatus {
    DRAFT,
    PENDING,
    IN_REVIEW,
    QUOTED,
    ACCEPTED,
    IN_PRODUCTION,
    READY,
    DELIVERED,
    REJECTED;

    public boolean canTransitionTo(QuotationStatus target) {
        return allowedTransitions().contains(target);
    }

    public Set<QuotationStatus> allowedTransitions() {
        return switch (this) {
            case DRAFT        -> Set.of(PENDING);
            case PENDING      -> Set.of(IN_REVIEW, REJECTED);
            case IN_REVIEW    -> Set.of(QUOTED, REJECTED);
            case QUOTED       -> Set.of(ACCEPTED, REJECTED);
            case ACCEPTED     -> Set.of(IN_PRODUCTION);
            case IN_PRODUCTION-> Set.of(READY);
            case READY        -> Set.of(DELIVERED);
            case DELIVERED, REJECTED -> Set.of();
        };
    }
}
