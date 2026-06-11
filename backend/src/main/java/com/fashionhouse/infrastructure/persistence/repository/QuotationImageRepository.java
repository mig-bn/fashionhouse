package com.fashionhouse.infrastructure.persistence.repository;

import com.fashionhouse.infrastructure.persistence.entity.QuotationImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuotationImageRepository extends JpaRepository<QuotationImageEntity, UUID> {
    List<QuotationImageEntity> findByQuotationId(UUID quotationId);
}
