package com.fashionhouse.domain.model.user;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public class User {

    private final UUID id;
    private Email email;
    private String passwordHash;
    private Role role;
    private boolean active;
    private final Instant createdAt;
    private Instant updatedAt;

    public User(UUID id, Email email, String passwordHash, Role role,
                boolean active, Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id);
        this.email = Objects.requireNonNull(email);
        this.passwordHash = Objects.requireNonNull(passwordHash);
        this.role = Objects.requireNonNull(role);
        this.active = active;
        this.createdAt = Objects.requireNonNull(createdAt);
        this.updatedAt = Objects.requireNonNull(updatedAt);
    }

    public static User create(Email email, String passwordHash, Role role) {
        Instant now = Instant.now();
        return new User(UUID.randomUUID(), email, passwordHash, role, true, now, now);
    }

    public void deactivate() {
        this.active = false;
        this.updatedAt = Instant.now();
    }

    public void activate() {
        this.active = true;
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public Email getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
