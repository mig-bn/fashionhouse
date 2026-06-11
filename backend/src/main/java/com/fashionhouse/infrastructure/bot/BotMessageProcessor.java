package com.fashionhouse.infrastructure.bot;

import com.fashionhouse.application.service.BotInteractionService;
import com.fashionhouse.domain.model.bot.BotChannel;
import com.fashionhouse.domain.model.bot.BotIntent;
import com.fashionhouse.infrastructure.persistence.entity.BotInteractionEntity;
import com.fashionhouse.infrastructure.persistence.entity.CustomerEntity;
import com.fashionhouse.infrastructure.persistence.entity.OrderEntity;
import com.fashionhouse.infrastructure.persistence.entity.QuotationEntity;
import com.fashionhouse.infrastructure.persistence.repository.OrderRepository;
import com.fashionhouse.infrastructure.persistence.repository.QuotationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BotMessageProcessor {

    private final BotIntentResolver         intentResolver;
    private final CustomerLookupService     customerLookup;
    private final BotInteractionService     interactionService;
    private final HumanHandoffService       handoffService;
    private final WhatsAppSenderService     whatsAppSender;
    private final TelegramSenderService     telegramSender;
    private final OrderRepository           orderRepo;
    private final QuotationRepository       quotationRepo;

    public void process(BotChannel channel, String externalId, String senderName, String text) {
        log.info("[BOT] Incoming {} from {} ({}): {}", channel, senderName, externalId, text);

        BotIntent intent = intentResolver.resolve(text);

        Optional<CustomerEntity> customerOpt = customerLookup.findByPhone(externalId);
        UUID customerId = customerOpt.map(CustomerEntity::getId).orElse(null);

        String reply;
        boolean transferred = false;

        switch (intent) {
            case ORDER_STATUS -> {
                reply = buildOrderReply(customerOpt);
            }
            case QUOTATION_STATUS -> {
                reply = buildQuotationReply(customerOpt);
            }
            case HUMAN_HANDOFF, UNKNOWN -> {
                reply       = handoffService.buildHandoffReply();
                transferred = true;
            }
            default -> {
                reply       = handoffService.buildHandoffReply();
                transferred = true;
            }
        }

        // Enviar respuesta al usuario por su canal
        sendReply(channel, externalId, reply);

        // Guardar en BD
        BotInteractionEntity saved = interactionService.saveInteraction(
                channel, externalId, senderName, text,
                intent, reply, transferred, customerId
        );

        // Notificar staff si hubo transferencia
        if (transferred) {
            handoffService.notifyStaff(saved);
        }
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private String buildOrderReply(Optional<CustomerEntity> customerOpt) {
        if (customerOpt.isEmpty()) {
            return "No encontramos una cuenta asociada a este número. " +
                   "Ingresá a tu cuenta en fashionhouse.com para ver el estado de tus pedidos.";
        }
        CustomerEntity customer = customerOpt.get();
        List<OrderEntity> orders = orderRepo.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        if (orders.isEmpty()) {
            return "Hola " + customer.getFirstName() + "! No encontramos pedidos recientes en tu cuenta.";
        }
        var lastOrder = orders.get(0);
        return String.format(
                "Hola %s! Tu último pedido (#%s) está en estado: *%s*. " +
                "Podés ver el detalle completo en tu cuenta.",
                customer.getFirstName(),
                lastOrder.getId().toString().substring(0, 8).toUpperCase(),
                lastOrder.getStatus().name()
        );
    }

    private String buildQuotationReply(Optional<CustomerEntity> customerOpt) {
        if (customerOpt.isEmpty()) {
            return "No encontramos una cuenta asociada a este número. " +
                   "Ingresá a tu cuenta en fashionhouse.com para gestionar tus cotizaciones.";
        }
        CustomerEntity customer = customerOpt.get();
        List<QuotationEntity> quotations = quotationRepo.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        if (quotations.isEmpty()) {
            return "Hola " + customer.getFirstName() + "! No encontramos cotizaciones activas en tu cuenta.";
        }
        QuotationEntity last = quotations.get(0);
        return String.format(
                "Hola %s! Tu cotización más reciente está en estado: *%s*. " +
                "Podés ver los detalles en tu cuenta.",
                customer.getFirstName(),
                last.getStatus().name()
        );
    }

    private void sendReply(BotChannel channel, String externalId, String message) {
        switch (channel) {
            case WHATSAPP -> whatsAppSender.send(externalId, message);
            case TELEGRAM -> telegramSender.sendToUser(externalId, message);
        }
    }
}
