package com.finanzas.savings;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/savings")
@RequiredArgsConstructor
public class SavingsController {
    private final SavingsService service;

    // Transferencia puntual de ahorro (sin planes): crea gasto en origen e ingreso en destino
    @PostMapping("/transfer")
    public ResponseEntity<SavingsDto.AdHocResult> transfer(@Valid @RequestBody SavingsDto.AdHocCreate body) {
        var res = service.executeTransfer(body);
        return ResponseEntity.created(URI.create("/api/v1/savings/transfer")).body(res);
    }
}
