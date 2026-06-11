package com.fashionhouse.interfaces.rest.dto.quotation;

import java.time.OffsetDateTime;
import java.util.UUID;

public record QuotationImageDto(
    UUID id,
    String url,
    String altText,
    String uploadedBy,
    OffsetDateTime createdAt
) {}
