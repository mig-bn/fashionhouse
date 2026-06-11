package com.fashionhouse.interfaces.rest.controller;

import com.fashionhouse.application.service.BotInteractionService;
import com.fashionhouse.interfaces.rest.dto.ApiResponse;
import com.fashionhouse.interfaces.rest.dto.bot.BotInteractionDto;
import com.fashionhouse.interfaces.rest.dto.bot.BotStatsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/bot")
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
@RequiredArgsConstructor
public class BotAdminController {

    private final BotInteractionService botService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BotInteractionDto>>> list(
            @RequestParam(defaultValue = "0")     int page,
            @RequestParam(defaultValue = "20")    int size,
            @RequestParam(defaultValue = "false") boolean pending
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(botService.findAll(pageable, pending)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BotInteractionDto>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(botService.findById(id)));
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<BotInteractionDto>> resolve(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(botService.markResolved(id)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<BotStatsDto>> stats() {
        return ResponseEntity.ok(ApiResponse.ok(botService.getStats()));
    }
}
