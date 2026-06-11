package com.fashionhouse.infrastructure.bot;

import com.fashionhouse.infrastructure.persistence.entity.CustomerEntity;
import com.fashionhouse.infrastructure.persistence.repository.CustomerRepository;
import com.fashionhouse.infrastructure.persistence.repository.PhoneVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomerLookupService {

    private final PhoneVerificationRepository phoneVerRepo;
    private final CustomerRepository customerRepo;

    @Transactional(readOnly = true)
    public Optional<CustomerEntity> findByPhone(String phone) {
        // 1. Buscar en phone_verifications (teléfonos verificados explícitamente)
        Optional<CustomerEntity> byVerification = phoneVerRepo.findByPhone(normalise(phone))
                .flatMap(pv -> customerRepo.findByUserId(pv.getUser().getId()));
        if (byVerification.isPresent()) return byVerification;

        // 2. Fallback: buscar en customers.whatsapp_phone
        return customerRepo.findByWhatsappPhone(normalise(phone));
    }

    private String normalise(String phone) {
        if (phone == null) return "";
        return phone.replaceAll("[^0-9+]", "");
    }
}
