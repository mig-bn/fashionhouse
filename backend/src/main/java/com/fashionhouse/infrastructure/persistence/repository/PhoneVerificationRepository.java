package com.fashionhouse.infrastructure.persistence.repository;

import com.fashionhouse.infrastructure.persistence.entity.PhoneVerificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PhoneVerificationRepository extends JpaRepository<PhoneVerificationEntity, UUID> {

    Optional<PhoneVerificationEntity> findByPhone(String phone);
}
