package com.finanzas.accounts;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {
    private final AccountRepository repo;
    public AccountController(AccountRepository repo) { this.repo = repo; }

    @GetMapping
    public List<AccountDto.View> list() {
        return repo.findAll().stream().map(AccountDto::toView).toList();
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody AccountDto.Create body) {
        if (repo.existsByNameIgnoreCase(body.name)) {
            return ResponseEntity.status(409).body(problem(409, "Account exists"));
        }
        Account a = new Account();
        a.setName(body.name.trim());
        a.setInitialBalance(java.math.BigDecimal.valueOf(body.initialBalance == null ? 0.0 : body.initialBalance));
        if (body.type != null) {
            try { a.setType(Account.Type.valueOf(body.type.toUpperCase())); } catch (Exception ignored) {}
        }
        repo.save(a);
        return ResponseEntity.created(URI.create("/api/v1/accounts/" + a.getId())).body(AccountDto.toView(a));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody AccountDto.Update body) {
        return repo.findById(id).<ResponseEntity<?>>map(a -> {
            if (body.name != null) a.setName(body.name.trim());
            if (body.initialBalance != null) a.setInitialBalance(java.math.BigDecimal.valueOf(body.initialBalance));
            if (body.type != null) {
                try { a.setType(Account.Type.valueOf(body.type.toUpperCase())); } catch (Exception ignored) {}
            }
            repo.save(a);
            return ResponseEntity.ok(AccountDto.toView(a));
        }).orElseGet(() -> ResponseEntity.status(404).body(problem(404, "Not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.status(404).body(problem(404, "Not found"));
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private static Problem problem(int status, String title) {
        Problem p = new Problem();
        p.status = status; p.title = title; return p;
    }

    static class Problem { public String type; public String title; public Integer status; public String detail; public String instance; }
}
