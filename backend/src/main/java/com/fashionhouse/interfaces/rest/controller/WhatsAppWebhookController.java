package com.fashionhouse.interfaces.rest.controller;

import com.fashionhouse.domain.model.bot.BotChannel;
import com.fashionhouse.infrastructure.bot.BotMessageProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/bot/whatsapp")
@RequiredArgsConstructor
public class WhatsAppWebhookController {

    @Value("${bot.whatsapp.verify-token:fashionhouse-verify}")
    private String verifyToken;

    private final BotMessageProcessor processor;

    /** Verificación de webhook requerida por Meta */
    @GetMapping
    public ResponseEntity<String> verify(
            @RequestParam("hub.mode")         String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge")    String challenge
    ) {
        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
            log.info("[BOT-WA] Webhook verified successfully");
            return ResponseEntity.ok(challenge);
        }
        log.warn("[BOT-WA] Webhook verification failed");
        return ResponseEntity.status(403).body("Forbidden");
    }

    /** Recepción de mensajes de WhatsApp */
    @PostMapping
    public ResponseEntity<Void> receive(@RequestBody Map<String, Object> payload) {
        try {
            extractAndProcess(payload);
        } catch (Exception e) {
            log.error("[BOT-WA] Error processing webhook payload: {}", e.getMessage());
        }
        // Siempre responder 200 a Meta para evitar reintentos
        return ResponseEntity.ok().build();
    }

    @SuppressWarnings("unchecked")
    private void extractAndProcess(Map<String, Object> payload) {
        List<Map<String, Object>> entries = (List<Map<String, Object>>) payload.get("entry");
        if (entries == null || entries.isEmpty()) return;

        for (Map<String, Object> entry : entries) {
            List<Map<String, Object>> changes = (List<Map<String, Object>>) entry.get("changes");
            if (changes == null) continue;
            for (Map<String, Object> change : changes) {
                Map<String, Object> value = (Map<String, Object>) change.get("value");
                if (value == null) continue;

                List<Map<String, Object>> messages = (List<Map<String, Object>>) value.get("messages");
                if (messages == null || messages.isEmpty()) continue;

                List<Map<String, Object>> contacts = (List<Map<String, Object>>) value.get("contacts");

                for (Map<String, Object> message : messages) {
                    String type = (String) message.get("type");
                    if (!"text".equals(type)) continue;

                    String from = (String) message.get("from");
                    Map<String, Object> textObj = (Map<String, Object>) message.get("text");
                    String text = textObj != null ? (String) textObj.get("body") : "";

                    String senderName = null;
                    if (contacts != null && !contacts.isEmpty()) {
                        Map<String, Object> profile = (Map<String, Object>) contacts.get(0).get("profile");
                        if (profile != null) senderName = (String) profile.get("name");
                    }

                    processor.process(BotChannel.WHATSAPP, from, senderName, text);
                }
            }
        }
    }
}
