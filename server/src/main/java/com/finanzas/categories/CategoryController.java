package com.finanzas.categories;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {
    private final CategoryRepository repo;
    public CategoryController(CategoryRepository repo) { this.repo = repo; }

    static class Body { @NotBlank public String name; }

    @GetMapping
    public List<Category> list() { return repo.findAll(); }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody Body body) {
        if (repo.existsByNameIgnoreCase(body.name)) return ResponseEntity.status(409).body(problem(409, "Category exists"));
        Category c = new Category(); c.setName(body.name.trim()); repo.save(c);
        return ResponseEntity.created(URI.create("/api/v1/categories/" + c.getId())).body(c);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> rename(@PathVariable Long id, @Valid @RequestBody Body body) {
        return repo.findById(id).<ResponseEntity<?>>map(c -> { c.setName(body.name.trim()); repo.save(c); return ResponseEntity.ok(c); })
                .orElseGet(() -> ResponseEntity.status(404).body(problem(404, "Not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.status(404).body(problem(404, "Not found"));
        repo.deleteById(id); return ResponseEntity.noContent().build();
    }

    private static Problem problem(int status, String title) { var p = new Problem(); p.status = status; p.title = title; return p; }
    static class Problem { public String type; public String title; public Integer status; public String detail; public String instance; }
}

