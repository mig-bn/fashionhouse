package com.fashionhouse.interfaces.rest.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record RefreshRequest(
        @NotBlank(message = "El refresh token es requerido")
        String refreshToken
) {}
