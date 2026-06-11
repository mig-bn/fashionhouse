package com.fashionhouse.infrastructure.persistence.repository;

import com.fashionhouse.infrastructure.persistence.entity.CustomerNoteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerNoteRepository extends JpaRepository<CustomerNoteEntity, UUID> {
    List<CustomerNoteEntity> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
}
