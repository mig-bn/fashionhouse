package com.fashionhouse.interfaces.rest.controller;

import com.fashionhouse.domain.model.bot.BotChannel;
import com.fashionhouse.infrastructure.bot.BotMessageProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/bot/telegram")
@RequiredArgsConstructor
public class TelegramWebhookController {

    private final BotMessageProcessor processor;

    @PostMapping
    public ResponseEntity<Void> receive(@RequestBody Map<String, Object> payload) {
        try {
            extractAndProcess(payload);
        } catch (Exception e) {
            log.error("[BOT-TG] Error processing webhook payload: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @SuppressWarnings("unchecked")
    private void extractAndProcess(Map<String, Object> payload) {
        Map<String, Object> message = (Map<String, Object>) payload.get("message");
        if (message == null) return;

        Map<String, Object> chat = (Map<String, Object>) message.get("chat");
        if (chat == null) return;

        String chatId = String.valueOf(chat.get("id"));

        Map<String, Object> from = (Map<String, Object>) message.get("from");
        String senderName = null;
        if (from != null) {
            String firstName = (String) from.get("first_name");
            String lastName  = (String) from.get("last_name");
            senderName = firstName != null ? firstName + (lastName != null ? " " + lastName : "") : null;
        }

        String text = (String) message.get("text");
        if (text == null || text.isBlank()) return;

        processor.process(BotChannel.TELEGRAM, chatId, senderName, text);
    }
}
