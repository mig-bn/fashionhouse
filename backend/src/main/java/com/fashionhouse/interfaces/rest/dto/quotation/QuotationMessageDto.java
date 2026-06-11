package com.fashionhouse.interfaces.rest.dto.quotation;

import com.fashionhouse.domain.model.quotation.SenderType;
import java.time.OffsetDateTime;
import java.util.UUID;

public record QuotationMessageDto(
    UUID id,
    SenderType senderType,
    String senderName,
    String content,
    OffsetDateTime createdAt
) {}
