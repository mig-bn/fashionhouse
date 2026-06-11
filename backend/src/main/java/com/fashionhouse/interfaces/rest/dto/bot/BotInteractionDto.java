package com.fashionhouse.interfaces.rest.dto.bot;

import com.fashionhouse.domain.model.bot.BotChannel;
import com.fashionhouse.domain.model.bot.BotIntent;

import java.time.OffsetDateTime;
import java.util.UUID;

public record BotInteractionDto(
        UUID id,
        BotChannel channel,
        String externalId,
        String senderName,
        String incomingMsg,
        String botResponse,
        BotIntent intent,
        boolean transferred,
        boolean resolved,
        UUID customerId,
        String customerName,
        OffsetDateTime createdAt
) {}
