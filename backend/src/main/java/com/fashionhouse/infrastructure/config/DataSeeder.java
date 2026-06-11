package com.fashionhouse.infrastructure.config;

import com.fashionhouse.domain.model.user.Role;
import com.fashionhouse.infrastructure.persistence.entity.UserEntity;
import com.fashionhouse.infrastructure.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private static final String ADMIN_EMAIL    = "admin@fashionhouse.com";
    private static final String ADMIN_PASSWORD = "admin.123";

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("=== DataSeeder ===  Admin → email: {}  password: {}", ADMIN_EMAIL, ADMIN_PASSWORD);
        seedAdmin();
    }

    private void seedAdmin() {
        if (userRepository.existsByEmail(ADMIN_EMAIL)) {
            log.debug("Seeder: usuario admin ya existe, se omite creación.");
            return;
        }

        UserEntity admin = UserEntity.builder()
                .email(ADMIN_EMAIL)
                .passwordHash(passwordEncoder.encode(ADMIN_PASSWORD))
                .role(Role.ADMIN)
                .active(true)
                .build();

        userRepository.save(admin);
        log.info("✅ Seeder: usuario admin creado → email={} password={}", ADMIN_EMAIL, ADMIN_PASSWORD);
    }
}
