package com.fashionhouse.infrastructure.persistence.repository;

import com.fashionhouse.infrastructure.persistence.entity.BotInteractionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BotInteractionRepository extends JpaRepository<BotInteractionEntity, UUID> {

    List<BotInteractionEntity> findByTransferredTrueAndResolvedFalse();

    Page<BotInteractionEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<BotInteractionEntity> findByTransferredTrueAndResolvedFalseOrderByCreatedAtDesc(Pageable pageable);

    long countByTransferredTrueAndResolvedFalse();

    long countByResolvedTrue();
}
