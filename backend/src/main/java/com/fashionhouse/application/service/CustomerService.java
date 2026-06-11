package com.fashionhouse.application.service;

import com.fashionhouse.domain.exception.ResourceNotFoundException;
import com.fashionhouse.domain.model.quotation.QuotationStatus;
import com.fashionhouse.domain.model.user.Role;
import com.fashionhouse.infrastructure.persistence.entity.CustomerEntity;
import com.fashionhouse.infrastructure.persistence.entity.CustomerNoteEntity;
import com.fashionhouse.infrastructure.persistence.entity.OrderEntity;
import com.fashionhouse.infrastructure.persistence.entity.QuotationEntity;
import com.fashionhouse.infrastructure.persistence.entity.UserEntity;
import com.fashionhouse.infrastructure.persistence.repository.*;
import com.fashionhouse.interfaces.rest.dto.customer.*;
import com.fashionhouse.interfaces.rest.dto.order.OrderSummaryDto;
import com.fashionhouse.interfaces.rest.dto.quotation.QuotationSummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerNoteRepository noteRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final QuotationRepository quotationRepository;
    private final UserRepository userRepository;

    // ── Mi Cuenta (cliente autenticado) ────────────────────────────────────────

    @Transactional(readOnly = true)
    public MyAccountDto getMyAccount() {
        CustomerEntity customer = resolveCurrentCustomer();

        long totalOrders = orderRepository.countByCustomerId(customer.getId());
        BigDecimal totalSpent = orderRepository.sumTotalByCustomerId(customer.getId());

        // Cotizaciones activas = cualquier estado no terminal
        Set<QuotationStatus> terminalStatuses = Set.of(QuotationStatus.DELIVERED, QuotationStatus.REJECTED);
        List<QuotationEntity> allQuotations = quotationRepository
                .findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        long activeQuotations = allQuotations.stream()
                .filter(q -> !terminalStatuses.contains(q.getStatus()))
                .count();

        List<OrderSummaryDto> recentOrders = orderRepository
                .findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream().limit(5)
                .map(this::toOrderSummary)
                .toList();

        List<QuotationSummaryDto> activeQuotationList = allQuotations.stream()
                .filter(q -> !terminalStatuses.contains(q.getStatus()))
                .limit(5)
                .map(q -> toQuotationSummary(q, customer))
                .toList();

        String email = customer.getUser() != null ? customer.getUser().getEmail() : null;

        return new MyAccountDto(
                customer.getId(),
                customer.getFirstName(),
                customer.getLastName(),
                email,
                customer.getPhone(),
                customer.getWhatsappPhone(),
                customer.getBirthDate(),
                customer.isTrustedClient(),
                customer.getLoyaltyPoints(),
                totalOrders,
                activeQuotations,
                totalSpent,
                recentOrders,
                activeQuotationList
        );
    }

    @Transactional
    public MyAccountDto updateMyProfile(UpdateCustomerRequest request) {
        CustomerEntity customer = resolveCurrentCustomer();
        applyProfileUpdates(customer, request);
        customerRepository.save(customer);
        return getMyAccount();
    }

    // ── Admin: listado y detalle de clientes ───────────────────────────────────

    @Transactional(readOnly = true)
    public Page<CustomerSummaryDto> findAll(Boolean trustedOnly, Pageable pageable) {
        Page<CustomerEntity> page = trustedOnly != null && trustedOnly
                ? customerRepository.findByTrustedClientTrue(pageable)
                : customerRepository.findAllByOrderByCreatedAtDesc(pageable);
        return page.map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public CustomerDetailDto findById(UUID customerId) {
        CustomerEntity customer = requireCustomer(customerId);
        return toDetail(customer);
    }

    @Transactional
    public CustomerDetailDto toggleTrustedClient(UUID customerId) {
        CustomerEntity customer = requireCustomer(customerId);
        boolean nowTrusted = !customer.isTrustedClient();
        customer.setTrustedClient(nowTrusted);

        // Actualizar rol del usuario vinculado
        if (customer.getUser() != null) {
            UserEntity user = customer.getUser();
            user.setRole(nowTrusted ? Role.TRUSTED_CLIENT : Role.CUSTOMER);
            userRepository.save(user);
        }

        customerRepository.save(customer);
        return toDetail(customer);
    }

    @Transactional
    public CustomerDetailDto updateTags(UUID customerId, List<String> tags) {
        CustomerEntity customer = requireCustomer(customerId);
        customer.setInternalTags(tags.toArray(new String[0]));
        customerRepository.save(customer);
        return toDetail(customer);
    }

    @Transactional
    public CustomerDetailDto addNote(UUID customerId, AddNoteRequest request) {
        CustomerEntity customer = requireCustomer(customerId);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserEntity author = userRepository.findByEmail(auth.getName()).orElse(null);

        CustomerNoteEntity note = CustomerNoteEntity.builder()
                .customer(customer)
                .author(author)
                .content(request.content())
                .build();
        noteRepository.save(note);
        return toDetail(customer);
    }

    @Transactional
    public CustomerDetailDto updateProfile(UUID customerId, UpdateCustomerRequest request) {
        CustomerEntity customer = requireCustomer(customerId);
        applyProfileUpdates(customer, request);
        customerRepository.save(customer);
        return toDetail(customer);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void applyProfileUpdates(CustomerEntity customer, UpdateCustomerRequest request) {
        if (request.phone() != null)        customer.setPhone(request.phone());
        if (request.whatsappPhone() != null) customer.setWhatsappPhone(request.whatsappPhone());
        if (request.addressLine() != null)  customer.setAddressLine(request.addressLine());
        if (request.city() != null)         customer.setCity(request.city());
        if (request.state() != null)        customer.setState(request.state());
        if (request.postalCode() != null)   customer.setPostalCode(request.postalCode());
        if (request.internalTags() != null) customer.setInternalTags(request.internalTags().toArray(new String[0]));
    }

    private CustomerEntity resolveCurrentCustomer() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return customerRepository.findByUserEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Perfil de cliente", auth.getName()));
    }

    private CustomerEntity requireCustomer(UUID id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id.toString()));
    }

    // ── Mapeo ─────────────────────────────────────────────────────────────────

    private CustomerSummaryDto toSummary(CustomerEntity c) {
        long orderCount = orderRepository.countByCustomerId(c.getId());
        long quotationCount = quotationRepository.countByCustomerId(c.getId());
        BigDecimal ltv = orderRepository.sumTotalByCustomerId(c.getId());
        var lastOrder = orderRepository.findLastOrderDateByCustomerId(c.getId()).orElse(null);
        String email = c.getUser() != null ? c.getUser().getEmail() : null;

        return new CustomerSummaryDto(
                c.getId(), c.getFirstName(), c.getLastName(), email, c.getPhone(),
                c.isTrustedClient(), orderCount, quotationCount, ltv, lastOrder,
                c.getInternalTags(), c.getCreatedAt()
        );
    }

    private CustomerDetailDto toDetail(CustomerEntity c) {
        long orderCount = orderRepository.countByCustomerId(c.getId());
        long quotationCount = quotationRepository.countByCustomerId(c.getId());
        BigDecimal ltv = orderRepository.sumTotalByCustomerId(c.getId());
        var lastOrder = orderRepository.findLastOrderDateByCustomerId(c.getId()).orElse(null);

        List<OrderSummaryDto> recentOrders = orderRepository
                .findByCustomerIdOrderByCreatedAtDesc(c.getId())
                .stream().limit(5).map(this::toOrderSummary).toList();

        List<QuotationSummaryDto> recentQuotations = quotationRepository
                .findByCustomerIdOrderByCreatedAtDesc(c.getId())
                .stream().limit(5).map(q -> toQuotationSummary(q, c)).toList();

        List<CustomerNoteDto> notes = noteRepository
                .findByCustomerIdOrderByCreatedAtDesc(c.getId())
                .stream()
                .map(n -> new CustomerNoteDto(
                        n.getId(),
                        n.getAuthor() != null ? n.getAuthor().getEmail() : "Sistema",
                        n.getContent(),
                        n.getCreatedAt()
                ))
                .toList();

        String email = c.getUser() != null ? c.getUser().getEmail() : null;

        return new CustomerDetailDto(
                c.getId(), c.getFirstName(), c.getLastName(), email, c.getPhone(),
                c.getWhatsappPhone(), c.getBirthDate(),
                c.getAddressLine(), c.getCity(), c.getState(), c.getPostalCode(), c.getCountry(),
                c.isTrustedClient(), c.getLoyaltyPoints(), c.getInternalTags(),
                orderCount, quotationCount, ltv, lastOrder,
                recentOrders, recentQuotations, notes,
                c.getCreatedAt(), c.getUpdatedAt()
        );
    }

    private OrderSummaryDto toOrderSummary(OrderEntity o) {
        int itemCount = orderItemRepository.findByOrderId(o.getId()).size();
        return new OrderSummaryDto(o.getId(), o.getStatus(), o.getTotal(),
                o.getCurrency(), itemCount, o.getCreatedAt());
    }

    private QuotationSummaryDto toQuotationSummary(QuotationEntity q, CustomerEntity c) {
        return new QuotationSummaryDto(
                q.getId(), c.getId(),
                c.getFirstName() + " " + c.getLastName(),
                q.getDescription(), q.getStatus(),
                q.getProposedPrice(), q.getCurrency(),
                q.getEstimatedDelivery(), q.getCreatedAt(), q.getUpdatedAt()
        );
    }
}
