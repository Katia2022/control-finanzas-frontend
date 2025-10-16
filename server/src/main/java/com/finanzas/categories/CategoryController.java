package com.finanzas.categories;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService service;

    static class Body { @NotBlank public String name; }

    @GetMapping
    public List<Category> list() { return service.list(); }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody Body body) {
        Category c = service.create(body.name);
        return ResponseEntity.created(URI.create("/api/v1/categories/" + c.getId())).body(c);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> rename(@PathVariable Long id, @Valid @RequestBody Body body) {
        return ResponseEntity.ok(service.rename(id, body.name));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
