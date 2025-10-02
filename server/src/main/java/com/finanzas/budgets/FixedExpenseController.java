package com.finanzas.budgets;

import com.finanzas.categories.CategoryRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/fixed-expenses")
public class FixedExpenseController {
    private final FixedExpenseRepository repo;
    private final CategoryRepository categoryRepo;
    public FixedExpenseController(FixedExpenseRepository repo, CategoryRepository categoryRepo) { this.repo = repo; this.categoryRepo = categoryRepo; }

    public static class CreateBody { @NotBlank public String name; @NotNull public Double amount; public Long categoryId; }
    public static class UpdateBody { public String name; public Double amount; public Long categoryId; }

    @GetMapping
    public List<FixedExpenseDto.View> list() { return repo.findAll().stream().map(FixedExpenseDto::toView).toList(); }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateBody body) {
        FixedExpense f = new FixedExpense();
        f.setName(body.name.trim());
        f.setAmount(java.math.BigDecimal.valueOf(body.amount));
        if (body.categoryId != null) f.setCategory(categoryRepo.findById(body.categoryId).orElse(null));
        repo.save(f);
        return ResponseEntity.created(URI.create("/api/v1/fixed-expenses/" + f.getId())).body(FixedExpenseDto.toView(f));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody UpdateBody body) {
        return repo.findById(id).<ResponseEntity<?>>map(f -> {
            if (body.name != null) f.setName(body.name.trim());
            if (body.amount != null) f.setAmount(java.math.BigDecimal.valueOf(body.amount));
            if (body.categoryId != null) f.setCategory(categoryRepo.findById(body.categoryId).orElse(null));
            repo.save(f);
            return ResponseEntity.ok(FixedExpenseDto.toView(f));
        }).orElseGet(() -> ResponseEntity.status(404).body(problem(404, "Not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.status(404).body(problem(404, "Not found"));
        repo.deleteById(id); return ResponseEntity.noContent().build();
    }

    private static Problem problem(int status, String title) { var p = new Problem(); p.status = status; p.title = title; return p; }
    static class Problem { public String type; public String title; public Integer status; public String detail; public String instance; }
}
