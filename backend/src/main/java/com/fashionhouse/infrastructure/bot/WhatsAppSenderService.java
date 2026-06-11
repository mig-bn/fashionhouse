package com.fashionhouse.infrastructure.bot;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class WhatsAppSenderService {

    @Value("${bot.whatsapp.token:}")
    private String token;

    @Value("${bot.whatsapp.phone-id:}")
    private String phoneId;

    private final RestTemplate restTemplate = new RestTemplate();

    public void send(String phoneNumber, String message) {
        if (token.isBlank() || phoneId.isBlank()) {
            log.warn("[BOT-WA] Credentials not configured — skipping send to {}", phoneNumber);
            return;
        }

        String url = "https://graph.facebook.com/v18.0/" + phoneId + "/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        Map<String, Object> body = Map.of(
                "messaging_product", "whatsapp",
                "to", phoneNumber,
                "type", "text",
                "text", Map.of("body", message)
        );

        try {
            restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
            log.info("[BOT-WA] Sent message to {}", phoneNumber);
        } catch (Exception e) {
            log.error("[BOT-WA] Failed to send message to {}: {}", phoneNumber, e.getMessage());
        }
    }
}
