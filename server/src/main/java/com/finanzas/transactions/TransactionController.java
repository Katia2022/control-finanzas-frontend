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
    private final com.finanzas.settings.SettingRepository settingRepo;

    public TransactionController(TransactionRepository repo, AccountRepository accountRepo, CategoryRepository categoryRepo, com.finanzas.settings.SettingRepository settingRepo) {
        this.repo = repo; this.accountRepo = accountRepo; this.categoryRepo = categoryRepo; this.settingRepo = settingRepo;
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
    public List<TransactionDto.View> list(@RequestParam(required = false) String monthKey) {
        if (monthKey == null) return repo.findAll().stream().map(TransactionDto::toView).toList();
        YearMonth ym = YearMonth.parse(monthKey);
        int cutoff = settingRepo.findById("monthCutoffDay").map(s -> parseInt(s.getValueJson(), 1)).orElse(1);
        LocalDate start;
        LocalDate end;
        if (cutoff <= 1) {
            start = ym.atDay(1);
            end = ym.atEndOfMonth();
        } else {
            YearMonth prev = ym.minusMonths(1);
            int prevDay = Math.min(cutoff, prev.lengthOfMonth());
            int currDay = Math.min(cutoff, ym.lengthOfMonth());
            LocalDate prevCutoff = LocalDate.of(prev.getYear(), prev.getMonth(), prevDay);
            LocalDate currCutoff = LocalDate.of(ym.getYear(), ym.getMonth(), currDay);
            start = prevCutoff;
            end = currCutoff.minusDays(1);
        }
        return repo.findByDateBetween(start, end).stream().map(TransactionDto::toView).toList();
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
        return ResponseEntity.created(URI.create("/api/v1/transactions/" + t.getId())).body(TransactionDto.toView(t));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.status(404).body(problem(404, "Not found"));
        repo.deleteById(id); return ResponseEntity.noContent().build();
    }

    private static Problem problem(int status, String title) { var p = new Problem(); p.status = status; p.title = title; return p; }
    static class Problem { public String type; public String title; public Integer status; public String detail; public String instance; }

    private static int parseInt(String s, int def) {
        try { return Integer.parseInt(s); } catch (Exception e) { return def; }
    }
}
