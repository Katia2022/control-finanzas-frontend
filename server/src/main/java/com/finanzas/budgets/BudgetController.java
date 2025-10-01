package com.finanzas.budgets;

import com.finanzas.categories.CategoryRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/budgets/categories")
public class BudgetController {
    private final BudgetCategoryRepository repo;
    private final CategoryRepository categoryRepo;
    public BudgetController(BudgetCategoryRepository repo, CategoryRepository categoryRepo) { this.repo = repo; this.categoryRepo = categoryRepo; }

    public static class UpsertBody { @NotNull public Long categoryId; @NotNull public String monthKey; @NotNull public Double amount; }

    @GetMapping
    public List<BudgetCategory> list(@RequestParam(required = false) String monthKey) {
        return monthKey == null ? repo.findAll() : repo.findByMonthKey(monthKey);
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<?> upsert(@PathVariable Long categoryId, @Valid @RequestBody UpsertBody body) {
        var existing = repo.findAll().stream().filter(b -> b.getCategory().getId().equals(categoryId) && b.getMonthKey().equals(body.monthKey)).findFirst();
        BudgetCategory b = existing.orElseGet(BudgetCategory::new);
        b.setCategory(categoryRepo.findById(categoryId).orElseThrow());
        b.setMonthKey(body.monthKey);
        b.setAmount(java.math.BigDecimal.valueOf(body.amount));
        repo.save(b);
        return ResponseEntity.ok(b);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.status(404).build();
        repo.deleteById(id); return ResponseEntity.noContent().build();
    }
}

