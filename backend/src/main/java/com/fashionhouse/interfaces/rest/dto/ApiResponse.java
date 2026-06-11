package com.fashionhouse.interfaces.rest.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
    boolean success,
    T data,
    PageMeta meta,
    ApiError error,
    Instant timestamp
) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null, Instant.now());
    }

    public static <T> ApiResponse<T> ok(T data, PageMeta meta) {
        return new ApiResponse<>(true, data, meta, null, Instant.now());
    }

    public static <T> ApiResponse<T> error(ApiError error) {
        return new ApiResponse<>(false, null, null, error, Instant.now());
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record PageMeta(int page, int totalPages, long totalItems) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ApiError(
        String code,
        String message,
        java.util.List<FieldError> details
    ) {
        public record FieldError(String field, String message) {}
    }
}
