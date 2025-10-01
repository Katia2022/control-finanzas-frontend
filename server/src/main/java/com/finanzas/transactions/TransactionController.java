package com.finanzas.transactions;

import com.finanzas.accounts.AccountRepository;
import com.finanzas.categories.CategoryRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {
    private final TransactionRepository repo;
    private final AccountRepository accountRepo;
    private final CategoryRepository categoryRepo;

    public TransactionController(TransactionRepository repo, AccountRepository accountRepo, CategoryRepository categoryRepo) {
        this.repo = repo; this.accountRepo = accountRepo; this.categoryRepo = categoryRepo;
    }

    public static class CreateBody {
        @NotNull public Transaction.Type type;
        @NotNull public Long accountId;
        @NotNull public Long categoryId;
        @NotNull public Double amount;
        @NotBlank public String date; // yyyy-MM-dd
        public String description;
    }

    @GetMapping
    public List<Transaction> list(@RequestParam(required = false) String monthKey) {
        if (monthKey == null) return repo.findAll();
        YearMonth ym = YearMonth.parse(monthKey);
        return repo.findByDateBetween(ym.atDay(1), ym.atEndOfMonth());
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateBody body) {
        var t = new Transaction();
        t.setType(body.type);
        t.setAccount(accountRepo.findById(body.accountId).orElseThrow());
        t.setCategory(categoryRepo.findById(body.categoryId).orElseThrow());
        t.setAmount(java.math.BigDecimal.valueOf(body.amount));
        t.setDate(LocalDate.parse(body.date));
        t.setDescription(body.description);
        repo.save(t);
        return ResponseEntity.created(URI.create("/api/v1/transactions/" + t.getId())).body(t);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.status(404).body(problem(404, "Not found"));
        repo.deleteById(id); return ResponseEntity.noContent().build();
    }

    private static Problem problem(int status, String title) { var p = new Problem(); p.status = status; p.title = title; return p; }
    static class Problem { public String type; public String title; public Integer status; public String detail; public String instance; }
}

