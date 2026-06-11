package com.fashionhouse.infrastructure.bot;

import com.fashionhouse.domain.model.bot.BotIntent;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class BotIntentResolver {

    private static final Pattern ORDER_PATTERN =
            Pattern.compile("(?i)pedido|orden|order|compra|envio|envío|entrega|seguimiento|tracking");

    private static final Pattern QUOTATION_PATTERN =
            Pattern.compile("(?i)cotiz|cotización|medida|medidas|presupuest|personaliz|tela|diseño");

    private static final Pattern HANDOFF_PATTERN =
            Pattern.compile("(?i)asesor|humano|hablar|agente|ayuda|contacto|persona|soporte|vendedor");

    public BotIntent resolve(String text) {
        if (text == null || text.isBlank()) return BotIntent.UNKNOWN;

        if (ORDER_PATTERN.matcher(text).find())     return BotIntent.ORDER_STATUS;
        if (QUOTATION_PATTERN.matcher(text).find()) return BotIntent.QUOTATION_STATUS;
        if (HANDOFF_PATTERN.matcher(text).find())   return BotIntent.HUMAN_HANDOFF;

        return BotIntent.UNKNOWN;
    }
}
