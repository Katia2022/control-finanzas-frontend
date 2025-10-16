package com.finanzas.budgets;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/fixed-expenses")
@RequiredArgsConstructor
public class FixedExpenseController {
    private final FixedExpenseService service;

    public static class CreateBody { @NotBlank public String name; @NotNull public Double amount; public Long categoryId; }
    public static class UpdateBody { public String name; public Double amount; public Long categoryId; }

    @GetMapping
    public List<FixedExpenseDto.View> list() { return service.list(); }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateBody body) {
        var view = service.create(body.name, body.amount, body.categoryId);
        return ResponseEntity.created(URI.create("/api/v1/fixed-expenses/" + view.id)).body(view);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody UpdateBody body) {
        var view = service.update(id, body.name, body.amount, body.categoryId);
        return ResponseEntity.ok(view);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
