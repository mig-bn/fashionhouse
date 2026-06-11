package com.fashionhouse.interfaces.rest.dto.customer;

import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateCustomerRequest(
    @Size(max = 30) String phone,
    @Size(max = 30) String whatsappPhone,
    @Size(max = 255) String addressLine,
    @Size(max = 100) String city,
    @Size(max = 100) String state,
    @Size(max = 20)  String postalCode,
    List<String> internalTags
) {}
