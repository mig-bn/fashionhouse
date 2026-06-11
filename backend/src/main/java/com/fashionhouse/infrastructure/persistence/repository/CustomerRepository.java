package com.fashionhouse.infrastructure.persistence.repository;

import com.fashionhouse.infrastructure.persistence.entity.CustomerEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<CustomerEntity, UUID> {

    Optional<CustomerEntity> findByUserId(UUID userId);

    @Query("SELECT c FROM CustomerEntity c JOIN c.user u WHERE u.email = :email")
    Optional<CustomerEntity> findByUserEmail(String email);

    Page<CustomerEntity> findByTrustedClientTrue(Pageable pageable);

    Page<CustomerEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Optional<CustomerEntity> findByWhatsappPhone(String whatsappPhone);
}
