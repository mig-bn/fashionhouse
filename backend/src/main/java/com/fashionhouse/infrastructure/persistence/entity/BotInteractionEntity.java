package com.fashionhouse.infrastructure.persistence.entity;

import com.fashionhouse.domain.model.bot.BotChannel;
import com.fashionhouse.domain.model.bot.BotIntent;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "bot_interactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BotInteractionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false,
            columnDefinition = "bot_channel")
    private BotChannel channel;

    @Column(name = "external_id", nullable = false, length = 100)
    private String externalId;

    @Column(name = "sender_name", length = 200)
    private String senderName;

    @Column(name = "incoming_msg", nullable = false, columnDefinition = "TEXT")
    private String incomingMsg;

    @Column(name = "bot_response", columnDefinition = "TEXT")
    private String botResponse;

    @Enumerated(EnumType.STRING)
    @Column(name = "intent", nullable = false,
            columnDefinition = "bot_intent")
    private BotIntent intent;

    @Column(name = "transferred", nullable = false)
    private boolean transferred;

    @Column(name = "resolved", nullable = false)
    private boolean resolved;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private CustomerEntity customer;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
