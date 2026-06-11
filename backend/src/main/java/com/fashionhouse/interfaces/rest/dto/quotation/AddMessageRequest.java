package com.fashionhouse.interfaces.rest.dto.quotation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddMessageRequest(
    @NotBlank @Size(max = 2000) String content
) {}
