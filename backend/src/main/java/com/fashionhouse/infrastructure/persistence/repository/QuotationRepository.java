package com.fashionhouse.infrastructure.persistence.repository;

import com.fashionhouse.domain.model.quotation.QuotationStatus;
import com.fashionhouse.infrastructure.persistence.entity.QuotationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuotationRepository extends JpaRepository<QuotationEntity, UUID> {
    Page<QuotationEntity> findByCustomerId(UUID customerId, Pageable pageable);
    List<QuotationEntity> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    Page<QuotationEntity> findByStatus(QuotationStatus status, Pageable pageable);
    Page<QuotationEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByCustomerId(UUID customerId);
}
