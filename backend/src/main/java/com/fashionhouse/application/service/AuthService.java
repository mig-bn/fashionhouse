package com.fashionhouse.application.service;

import com.fashionhouse.domain.model.user.Role;
import com.fashionhouse.infrastructure.persistence.entity.CustomerEntity;
import com.fashionhouse.infrastructure.persistence.entity.RefreshTokenEntity;
import com.fashionhouse.infrastructure.persistence.entity.UserEntity;
import com.fashionhouse.infrastructure.persistence.repository.CustomerRepository;
import com.fashionhouse.infrastructure.persistence.repository.RefreshTokenRepository;
import com.fashionhouse.infrastructure.persistence.repository.UserRepository;
import com.fashionhouse.infrastructure.security.JwtService;
import com.fashionhouse.interfaces.rest.dto.auth.AuthResponse;
import com.fashionhouse.interfaces.rest.dto.auth.LoginRequest;
import com.fashionhouse.interfaces.rest.dto.auth.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email().toLowerCase())) {
            throw new IllegalArgumentException("El email ya está registrado");
        }

        UserEntity user = UserEntity.builder()
                .email(request.email().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.CUSTOMER)
                .active(true)
                .build();
        user = userRepository.save(user);

        // Crear perfil de cliente automáticamente para rol CUSTOMER
        CustomerEntity customer = CustomerEntity.builder()
                .user(user)
                .firstName(request.firstName())
                .lastName(request.lastName())
                .country("MX")
                .build();
        customerRepository.save(customer);

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByEmail(request.email().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("Credenciales inválidas"));

        if (!user.isActive()) {
            throw new BadCredentialsException("La cuenta está desactivada");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Credenciales inválidas");
        }

        // Rotar refresh tokens: eliminar los anteriores del usuario
        refreshTokenRepository.deleteByUserId(user.getId());

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        if (!jwtService.isTokenValid(rawRefreshToken)) {
            throw new BadCredentialsException("Refresh token inválido o expirado");
        }

        String tokenHash = hashToken(rawRefreshToken);
        RefreshTokenEntity storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadCredentialsException("Refresh token no encontrado"));

        if (storedToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            refreshTokenRepository.delete(storedToken);
            throw new BadCredentialsException("Refresh token expirado");
        }

        UserEntity user = storedToken.getUser();

        // Rotar refresh token
        refreshTokenRepository.delete(storedToken);

        return buildAuthResponse(user);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(tokenHash)
                .ifPresent(refreshTokenRepository::delete);
    }

    private AuthResponse buildAuthResponse(UserEntity user) {
        String accessToken = jwtService.generateAccessToken(user.getEmail(), user.getRole().name());
        String rawRefreshToken = jwtService.generateRefreshToken(user.getEmail());

        // Guardar hash del refresh token (nunca el token en crudo)
        RefreshTokenEntity refreshTokenEntity = RefreshTokenEntity.builder()
                .user(user)
                .tokenHash(hashToken(rawRefreshToken))
                .expiresAt(OffsetDateTime.now().plusSeconds(jwtService.getRefreshExpirationMs() / 1000))
                .build();
        refreshTokenRepository.save(refreshTokenEntity);

        return new AuthResponse(
                accessToken,
                rawRefreshToken,
                new AuthResponse.UserInfo(user.getId(), user.getEmail(), user.getRole(), user.isActive())
        );
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error al hashear el token", e);
        }
    }
}
