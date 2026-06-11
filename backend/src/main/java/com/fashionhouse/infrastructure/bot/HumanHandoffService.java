package com.fashionhouse.infrastructure.bot;

import com.fashionhouse.domain.model.bot.BotChannel;
import com.fashionhouse.infrastructure.persistence.entity.BotInteractionEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class HumanHandoffService {

    private final WhatsAppSenderService whatsAppSender;
    private final TelegramSenderService telegramSender;

    public void notifyStaff(BotInteractionEntity interaction) {
        String canal   = interaction.getChannel().name();
        String nombre  = interaction.getSenderName() != null ? interaction.getSenderName() : "Desconocido";
        String mensaje = interaction.getIncomingMsg();
        String id      = interaction.getId() != null ? interaction.getId().toString() : "—";

        String notif = String.format(
                "🔔 <b>Transferencia de bot (%s)</b>\n" +
                "👤 %s\n" +
                "💬 \"%s\"\n" +
                "🔗 Panel: /admin/bot/%s",
                canal, nombre, mensaje, id
        );

        // Notificar siempre al grupo de staff de Telegram (si está configurado)
        telegramSender.sendToStaff(notif);

        log.info("[BOT] Human handoff triggered for interaction {} via {}", id, canal);
    }

    public String buildHandoffReply() {
        return "Gracias por contactarnos. Un asesor revisará tu mensaje en breve y te responderá. 🙏";
    }
}
