package com.finanzas.budgets;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/budgets/categories")
@RequiredArgsConstructor
public class BudgetController {
    private final BudgetCategoryService service;

    public static class UpsertBody { @NotNull public Long categoryId; @NotNull public String monthKey; @NotNull public Double amount; }

    @GetMapping
    public List<BudgetCategoryDto.View> list(@RequestParam(required = false) String monthKey) {
        return service.list(monthKey);
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<?> upsert(@PathVariable Long categoryId, @Valid @RequestBody UpsertBody body) {
        var view = service.upsert(categoryId, body.monthKey, body.amount);
        return ResponseEntity.ok(view);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
