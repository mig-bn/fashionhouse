package com.fashionhouse.infrastructure.persistence.repository;

import com.fashionhouse.domain.model.order.OrderStatus;
import com.fashionhouse.infrastructure.persistence.entity.OrderEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {

    Page<OrderEntity> findByCustomerId(UUID customerId, Pageable pageable);

    List<OrderEntity> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);

    List<OrderEntity> findByStatus(OrderStatus status);

    long countByCustomerId(UUID customerId);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM OrderEntity o WHERE o.customer.id = :customerId")
    BigDecimal sumTotalByCustomerId(UUID customerId);

    @Query("SELECT MAX(o.createdAt) FROM OrderEntity o WHERE o.customer.id = :customerId")
    Optional<OffsetDateTime> findLastOrderDateByCustomerId(UUID customerId);
}
