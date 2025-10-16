package com.finanzas.transactions;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService service;

    public static class CreateBody extends TransactionDto.Create {}

    @GetMapping
    public List<TransactionDto.View> list(@RequestParam(required = false) String monthKey) { return service.list(monthKey); }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateBody body) {
        var view = service.create(body);
        return ResponseEntity.created(URI.create("/api/v1/transactions/" + view.id)).body(view);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody TransactionDto.Update body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // parseInt moved into TransactionService
}
