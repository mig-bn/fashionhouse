package com.fashionhouse.application.service;

import com.fashionhouse.application.port.EmailPort;
import com.fashionhouse.application.port.StoragePort;
import com.fashionhouse.domain.exception.QuotationStateException;
import com.fashionhouse.domain.exception.ResourceNotFoundException;
import com.fashionhouse.domain.model.quotation.QuotationStatus;
import com.fashionhouse.domain.model.quotation.SenderType;
import com.fashionhouse.infrastructure.persistence.entity.*;
import com.fashionhouse.infrastructure.persistence.repository.*;
import com.fashionhouse.interfaces.rest.dto.quotation.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final QuotationMessageRepository messageRepository;
    private final QuotationImageRepository imageRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final StoragePort storagePort;
    private final EmailPort emailPort;

    @Value("${minio.bucket-quotations}")
    private String quotationBucket;

    // ── Customer operations ────────────────────────────────────────────────────

    @Transactional
    public QuotationDetailDto createQuotation(CreateQuotationRequest request) {
        CustomerEntity customer = resolveCurrentCustomer();

        QuotationEntity quotation = QuotationEntity.builder()
                .customer(customer)
                .description(request.description())
                .measurements(request.measurements())
                .status(QuotationStatus.PENDING)
                .currency("MXN")
                .build();
        quotation = quotationRepository.save(quotation);

        if (request.initialMessage() != null && !request.initialMessage().isBlank()) {
            addMessageInternal(quotation, customer.getUser(), SenderType.CUSTOMER,
                    request.initialMessage());
        }

        notifyQuotationReceived(customer, quotation);

        return toDetail(quotation);
    }

    @Transactional(readOnly = true)
    public Page<QuotationSummaryDto> findMyQuotations(Pageable pageable) {
        CustomerEntity customer = resolveCurrentCustomer();
        return quotationRepository.findByCustomerId(customer.getId(), pageable)
                .map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public QuotationDetailDto findById(UUID quotationId) {
        QuotationEntity quotation = requireQuotation(quotationId);
        assertAccessible(quotation);
        return toDetail(quotation);
    }

    @Transactional
    public QuotationDetailDto addMessage(UUID quotationId, AddMessageRequest request) {
        QuotationEntity quotation = requireQuotation(quotationId);
        assertAccessible(quotation);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserEntity sender = userRepository.findByEmail(auth.getName()).orElse(null);
        SenderType senderType = isAdmin(auth) ? SenderType.STAFF : SenderType.CUSTOMER;

        addMessageInternal(quotation, sender, senderType, request.content());

        notifyNewMessage(quotation, senderType);

        return toDetail(quotation);
    }

    @Transactional
    public QuotationDetailDto uploadImage(UUID quotationId, MultipartFile file) throws IOException {
        QuotationEntity quotation = requireQuotation(quotationId);
        assertAccessible(quotation);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String uploadedBy = isAdmin(auth) ? "ADMIN" : "CUSTOMER";

        String objectName = "quotations/" + quotationId + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        String url = storagePort.upload(
                quotationBucket, objectName,
                file.getInputStream(), file.getSize(), file.getContentType());

        QuotationImageEntity image = QuotationImageEntity.builder()
                .quotation(quotation)
                .url(url)
                .altText(file.getOriginalFilename())
                .uploadedBy(uploadedBy)
                .build();
        imageRepository.save(image);

        return toDetail(quotation);
    }

    // ── Admin operations ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<QuotationSummaryDto> findAll(Pageable pageable) {
        return quotationRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public Page<QuotationSummaryDto> findByStatus(QuotationStatus status, Pageable pageable) {
        return quotationRepository.findByStatus(status, pageable).map(this::toSummary);
    }

    @Transactional
    public QuotationDetailDto respond(UUID quotationId, RespondQuotationRequest request) {
        QuotationEntity quotation = requireQuotation(quotationId);

        if (!quotation.getStatus().canTransitionTo(request.newStatus())) {
            throw new QuotationStateException(
                    quotation.getStatus().name(), request.newStatus().name());
        }

        quotation.setStatus(request.newStatus());

        if (request.proposedPrice() != null) quotation.setProposedPrice(request.proposedPrice());
        if (request.currency() != null)      quotation.setCurrency(request.currency());
        if (request.estimatedDelivery() != null) quotation.setEstimatedDelivery(request.estimatedDelivery());
        if (request.adminNotes() != null)    quotation.setAdminNotes(request.adminNotes());
        if (request.rejectionReason() != null) quotation.setRejectionReason(request.rejectionReason());

        quotation = quotationRepository.save(quotation);

        if (request.message() != null && !request.message().isBlank()) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserEntity admin = userRepository.findByEmail(auth.getName()).orElse(null);
            addMessageInternal(quotation, admin, SenderType.STAFF, request.message());
        }

        notifyStatusChange(quotation);

        return toDetail(quotation);
    }

    // ── Internal helpers ───────────────────────────────────────────────────────

    private void addMessageInternal(QuotationEntity quotation, UserEntity sender,
                                     SenderType senderType, String content) {
        QuotationMessageEntity message = QuotationMessageEntity.builder()
                .quotation(quotation)
                .senderType(senderType)
                .sender(sender)
                .content(content)
                .build();
        messageRepository.save(message);
    }

    private void notifyQuotationReceived(CustomerEntity customer, QuotationEntity quotation) {
        if (customer.getUser() != null) {
            try {
                emailPort.sendQuotationReceived(
                        customer.getUser().getEmail(),
                        customer.getFirstName(),
                        quotation.getId().toString());
            } catch (Exception ignored) {}
        }
    }

    private void notifyStatusChange(QuotationEntity quotation) {
        CustomerEntity customer = quotation.getCustomer();
        if (customer.getUser() != null) {
            try {
                emailPort.sendQuotationStatusUpdate(
                        customer.getUser().getEmail(),
                        customer.getFirstName(),
                        quotation.getId().toString(),
                        quotation.getStatus().name());
            } catch (Exception ignored) {}
        }
    }

    private void notifyNewMessage(QuotationEntity quotation, SenderType fromSender) {
        CustomerEntity customer = quotation.getCustomer();
        if (fromSender == SenderType.CUSTOMER && customer.getUser() != null) {
            // Notify admin — placeholder (no admin email configured)
            return;
        }
        if (fromSender == SenderType.STAFF && customer.getUser() != null) {
            try {
                emailPort.sendNewMessageNotification(
                        customer.getUser().getEmail(),
                        customer.getFirstName(),
                        quotation.getId().toString());
            } catch (Exception ignored) {}
        }
    }

    private void assertAccessible(QuotationEntity quotation) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (isAdmin(auth)) return;

        CustomerEntity customer = resolveCurrentCustomer();
        if (!quotation.getCustomer().getId().equals(customer.getId())) {
            throw new AccessDeniedException("No tienes acceso a esta cotización");
        }
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))
            || auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_STAFF"));
    }

    private CustomerEntity resolveCurrentCustomer() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return customerRepository.findByUserEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de cliente", auth.getName()));
    }

    private QuotationEntity requireQuotation(UUID id) {
        return quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cotización", id.toString()));
    }

    // ── Mapping ────────────────────────────────────────────────────────────────

    private QuotationDetailDto toDetail(QuotationEntity q) {
        List<QuotationMessageDto> messages = messageRepository
                .findByQuotationIdOrderByCreatedAtAsc(q.getId()).stream()
                .map(m -> new QuotationMessageDto(
                        m.getId(),
                        m.getSenderType(),
                        m.getSender() != null
                                ? resolveDisplayName(m.getSender())
                                : "Usuario eliminado",
                        m.getContent(),
                        m.getCreatedAt()))
                .toList();

        List<QuotationImageDto> images = imageRepository.findByQuotationId(q.getId()).stream()
                .map(i -> new QuotationImageDto(
                        i.getId(), i.getUrl(), i.getAltText(), i.getUploadedBy(), i.getCreatedAt()))
                .toList();

        CustomerEntity c = q.getCustomer();
        String customerEmail = c.getUser() != null ? c.getUser().getEmail() : null;

        return new QuotationDetailDto(
                q.getId(), c.getId(),
                c.getFirstName() + " " + c.getLastName(),
                customerEmail,
                q.getDescription(), q.getMeasurements(), q.getStatus(),
                q.getProposedPrice(), q.getCurrency(), q.getEstimatedDelivery(),
                q.getAdminNotes(), q.getRejectionReason(),
                messages, images, q.getCreatedAt(), q.getUpdatedAt());
    }

    private QuotationSummaryDto toSummary(QuotationEntity q) {
        CustomerEntity c = q.getCustomer();
        return new QuotationSummaryDto(
                q.getId(), c.getId(),
                c.getFirstName() + " " + c.getLastName(),
                q.getDescription(), q.getStatus(),
                q.getProposedPrice(), q.getCurrency(),
                q.getEstimatedDelivery(), q.getCreatedAt(), q.getUpdatedAt());
    }

    private String resolveDisplayName(UserEntity user) {
        return user.getEmail();
    }
}
