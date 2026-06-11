package com.fashionhouse.interfaces.rest.dto.quotation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateQuotationRequest(
    @NotBlank @Size(max = 2000) String description,
    String measurements,
    @Size(max = 1000) String initialMessage
) {}
