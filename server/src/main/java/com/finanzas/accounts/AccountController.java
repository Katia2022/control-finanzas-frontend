package com.finanzas.accounts;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {
    private final AccountService service;

    @GetMapping
    public List<AccountDto.View> list() { return service.list(); }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody AccountDto.Create body) {
        var view = service.create(body);
        return ResponseEntity.created(URI.create("/api/v1/accounts/" + view.id)).body(view);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody AccountDto.Update body) {
        return ResponseEntity.ok(service.update(id, body));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
