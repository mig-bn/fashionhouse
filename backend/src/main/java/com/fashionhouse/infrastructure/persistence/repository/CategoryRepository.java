package com.fashionhouse.infrastructure.persistence.repository;

import com.fashionhouse.infrastructure.persistence.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, UUID> {
    Optional<CategoryEntity> findBySlug(String slug);
    List<CategoryEntity> findByParentIsNull();
    List<CategoryEntity> findByActiveTrue();
}
