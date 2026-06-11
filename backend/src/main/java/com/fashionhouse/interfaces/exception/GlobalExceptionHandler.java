package com.fashionhouse.interfaces.exception;

import com.fashionhouse.domain.exception.*;
import com.fashionhouse.interfaces.rest.dto.ApiResponse;
import com.fashionhouse.interfaces.rest.dto.ApiResponse.ApiError;
import com.fashionhouse.interfaces.rest.dto.ApiResponse.ApiError.FieldError;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        List<FieldError> details = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> new FieldError(e.getField(), e.getDefaultMessage()))
            .toList();
        return ResponseEntity.badRequest().body(
            ApiResponse.error(new ApiError("VALIDATION_ERROR", "Datos de entrada inválidos", details))
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException ex) {
        List<FieldError> details = ex.getConstraintViolations().stream()
            .map(v -> new FieldError(v.getPropertyPath().toString(), v.getMessage()))
            .toList();
        return ResponseEntity.badRequest().body(
            ApiResponse.error(new ApiError("VALIDATION_ERROR", "Datos de entrada inválidos", details))
        );
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ApiResponse.error(new ApiError("NOT_FOUND", ex.getMessage(), null))
        );
    }

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleProductNotFound(ProductNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ApiResponse.error(new ApiError("PRODUCT_NOT_FOUND", ex.getMessage(), null))
        );
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ApiResponse<Void>> handleInsufficientStock(InsufficientStockException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            ApiResponse.error(new ApiError("INSUFFICIENT_STOCK", ex.getMessage(), null))
        );
    }

    @ExceptionHandler(OrderStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleOrderState(OrderStateException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(
            ApiResponse.error(new ApiError("INVALID_ORDER_TRANSITION", ex.getMessage(), null))
        );
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
            ApiResponse.error(new ApiError("UNAUTHORIZED", "Credenciales inválidas o token expirado", null))
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ApiResponse.error(new ApiError("FORBIDDEN", "No tienes permisos para realizar esta acción", null))
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(
            ApiResponse.error(new ApiError("BAD_REQUEST", ex.getMessage(), null))
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ApiResponse.error(new ApiError("INTERNAL_ERROR", "Error interno del servidor", null))
        );
    }
}
