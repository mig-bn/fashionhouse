package com.fashionhouse.infrastructure.persistence.repository;

import com.fashionhouse.infrastructure.persistence.entity.QuotationMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuotationMessageRepository extends JpaRepository<QuotationMessageEntity, UUID> {
    List<QuotationMessageEntity> findByQuotationIdOrderByCreatedAtAsc(UUID quotationId);
}
