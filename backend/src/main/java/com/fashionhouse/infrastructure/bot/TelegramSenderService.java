package com.fashionhouse.infrastructure.bot;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class TelegramSenderService {

    @Value("${bot.telegram.bot-token:}")
    private String botToken;

    @Value("${bot.telegram.staff-chat-id:}")
    private String staffChatId;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendToUser(String chatId, String message) {
        sendMessage(chatId, message);
    }

    public void sendToStaff(String message) {
        if (staffChatId.isBlank()) {
            log.warn("[BOT-TG] Staff chat ID not configured — skipping staff notification");
            return;
        }
        sendMessage(staffChatId, message);
    }

    private void sendMessage(String chatId, String message) {
        if (botToken.isBlank()) {
            log.warn("[BOT-TG] Bot token not configured — skipping send to chat {}", chatId);
            return;
        }

        String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "chat_id", chatId,
                "text", message,
                "parse_mode", "HTML"
        );

        try {
            restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
            log.info("[BOT-TG] Sent message to chat {}", chatId);
        } catch (Exception e) {
            log.error("[BOT-TG] Failed to send message to chat {}: {}", chatId, e.getMessage());
        }
    }
}
