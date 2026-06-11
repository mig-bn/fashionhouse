package com.fashionhouse.application.service;

import com.fashionhouse.domain.exception.ResourceNotFoundException;
import com.fashionhouse.domain.model.bot.BotChannel;
import com.fashionhouse.domain.model.bot.BotIntent;
import com.fashionhouse.infrastructure.persistence.entity.BotInteractionEntity;
import com.fashionhouse.infrastructure.persistence.entity.CustomerEntity;
import com.fashionhouse.infrastructure.persistence.repository.BotInteractionRepository;
import com.fashionhouse.infrastructure.persistence.repository.CustomerRepository;
import com.fashionhouse.interfaces.rest.dto.bot.BotInteractionDto;
import com.fashionhouse.interfaces.rest.dto.bot.BotStatsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BotInteractionService {

    private final BotInteractionRepository botRepo;
    private final CustomerRepository customerRepo;

    @Transactional
    public BotInteractionEntity saveInteraction(
            BotChannel channel,
            String externalId,
            String senderName,
            String incomingMsg,
            BotIntent intent,
            String botResponse,
            boolean transferred,
            UUID customerId
    ) {
        CustomerEntity customer = null;
        if (customerId != null) {
            customer = customerRepo.findById(customerId).orElse(null);
        }

        BotInteractionEntity entity = BotInteractionEntity.builder()
                .channel(channel)
                .externalId(externalId)
                .senderName(senderName)
                .incomingMsg(incomingMsg)
                .intent(intent)
                .botResponse(botResponse)
                .transferred(transferred)
                .resolved(false)
                .customer(customer)
                .build();

        return botRepo.save(entity);
    }

    @Transactional(readOnly = true)
    public Page<BotInteractionDto> findAll(Pageable pageable, boolean onlyPending) {
        Page<BotInteractionEntity> page = onlyPending
                ? botRepo.findByTransferredTrueAndResolvedFalseOrderByCreatedAtDesc(pageable)
                : botRepo.findAllByOrderByCreatedAtDesc(pageable);
        return page.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public BotInteractionDto findById(UUID id) {
        return toDto(getOrThrow(id));
    }

    @Transactional
    public BotInteractionDto markResolved(UUID id) {
        BotInteractionEntity entity = getOrThrow(id);
        entity.setResolved(true);
        return toDto(botRepo.save(entity));
    }

    @Transactional(readOnly = true)
    public long countPending() {
        return botRepo.countByTransferredTrueAndResolvedFalse();
    }

    @Transactional(readOnly = true)
    public BotStatsDto getStats() {
        long total    = botRepo.count();
        long pending  = botRepo.countByTransferredTrueAndResolvedFalse();
        long resolved = botRepo.countByResolvedTrue();
        double rate   = total > 0 ? (double) botRepo.findByTransferredTrueAndResolvedFalse().size() / total : 0.0;
        return new BotStatsDto(total, pending, resolved, Math.round(rate * 10000.0) / 100.0);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private BotInteractionEntity getOrThrow(UUID id) {
        return botRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interacción de bot no encontrada: " + id));
    }

    private BotInteractionDto toDto(BotInteractionEntity e) {
        String customerName = null;
        UUID   customerId   = null;
        if (e.getCustomer() != null) {
            customerId   = e.getCustomer().getId();
            customerName = e.getCustomer().getFirstName() + " " + e.getCustomer().getLastName();
        }
        return new BotInteractionDto(
                e.getId(),
                e.getChannel(),
                e.getExternalId(),
                e.getSenderName(),
                e.getIncomingMsg(),
                e.getBotResponse(),
                e.getIntent(),
                e.isTransferred(),
                e.isResolved(),
                customerId,
                customerName,
                e.getCreatedAt()
        );
    }
}
