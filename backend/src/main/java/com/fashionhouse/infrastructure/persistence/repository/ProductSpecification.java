package com.fashionhouse.infrastructure.persistence.repository;

import com.fashionhouse.infrastructure.persistence.entity.ProductEntity;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ProductSpecification {

    private ProductSpecification() {}

    public static Specification<ProductEntity> withFilters(
            UUID categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String size,
            String color,
            Boolean featured) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Solo productos activos en el catálogo público
            predicates.add(cb.isTrue(root.get("active")));

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("basePrice"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("basePrice"), maxPrice));
            }
            if (Boolean.TRUE.equals(featured)) {
                predicates.add(cb.isTrue(root.get("featured")));
            }

            // Filtrar por talla o color requiere join con variantes
            if (size != null || color != null) {
                var variantsJoin = root.join("variants", JoinType.INNER);
                predicates.add(cb.isTrue(variantsJoin.get("active")));
                if (size != null) {
                    predicates.add(cb.equal(variantsJoin.get("size"), size));
                }
                if (color != null) {
                    predicates.add(cb.equal(variantsJoin.get("color"), color));
                }
                // Evitar duplicados por el join
                assert query != null;
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
