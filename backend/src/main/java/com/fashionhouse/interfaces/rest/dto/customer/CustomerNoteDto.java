package com.fashionhouse.interfaces.rest.dto.customer;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CustomerNoteDto(
    UUID id,
    String authorEmail,
    String content,
    OffsetDateTime createdAt
) {}
