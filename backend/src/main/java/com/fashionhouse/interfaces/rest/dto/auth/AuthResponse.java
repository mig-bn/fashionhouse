package com.fashionhouse.interfaces.rest.dto.auth;

import com.fashionhouse.domain.model.user.Role;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserInfo user
) {
    public record UserInfo(
            UUID id,
            String email,
            Role role,
            boolean isActive
    ) {}
}
