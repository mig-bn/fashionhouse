package com.fashionhouse.interfaces.rest.dto.customer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddNoteRequest(
    @NotBlank @Size(max = 2000) String content
) {}
