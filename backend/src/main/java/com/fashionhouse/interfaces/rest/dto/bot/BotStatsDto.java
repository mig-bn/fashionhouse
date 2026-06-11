package com.fashionhouse.interfaces.rest.dto.bot;

public record BotStatsDto(
        long total,
        long pending,
        long resolved,
        double transferRate
) {}
