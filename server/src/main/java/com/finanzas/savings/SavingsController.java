package com.finanzas.savings;

import com.finanzas.accounts.AccountRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/savings")
public class SavingsController {
    private final SavingsPlanRepository planRepo;
    private final SavingsMoveRepository moveRepo;
    private final SavingsService service;
    private final AccountRepository accountRepo;

    public SavingsController(SavingsPlanRepository planRepo, SavingsMoveRepository moveRepo, SavingsService service, AccountRepository accountRepo) {
        this.planRepo = planRepo; this.moveRepo = moveRepo; this.service = service; this.accountRepo = accountRepo;
    }

    // Plans
    @GetMapping("/plans")
    public List<SavingsDto.PlanView> listPlans(@RequestParam(required = false) String monthKey) {
        var list = monthKey == null ? planRepo.findAll() : planRepo.findByMonthKey(monthKey);
        return list.stream().map(SavingsDto::toView).collect(Collectors.toList());
    }

    @PostMapping("/plans")
    public ResponseEntity<?> createPlan(@Valid @RequestBody SavingsDto.PlanCreate body) {
        var saved = service.createPlan(body);
        return ResponseEntity.created(URI.create("/api/v1/savings/plans/" + saved.getId())).body(SavingsDto.toView(saved));
    }

    @PatchMapping("/plans/{id}")
    public ResponseEntity<?> updatePlan(@PathVariable Long id, @Valid @RequestBody SavingsDto.PlanUpdate body) {
        if (!planRepo.existsById(id)) return ResponseEntity.status(404).body(problem(404, "Not found"));
        var saved = service.updatePlan(id, body);
        return ResponseEntity.ok(SavingsDto.toView(saved));
    }

    @DeleteMapping("/plans/{id}")
    public ResponseEntity<?> deletePlan(@PathVariable Long id) {
        if (!planRepo.existsById(id)) return ResponseEntity.status(404).body(problem(404, "Not found"));
        service.deletePlan(id);
        return ResponseEntity.noContent().build();
    }

    // Moves
    @GetMapping("/moves")
    public List<SavingsDto.MoveView> listMoves(@RequestParam(required = false) String monthKey) {
        List<SavingsMove> list;
        if (monthKey == null) list = moveRepo.findAll();
        else {
            YearMonth ym = YearMonth.parse(monthKey);
            LocalDate start = ym.atDay(1);
            LocalDate end = ym.atEndOfMonth();
            list = moveRepo.findByDateBetween(start, end);
        }
        return list.stream().map(SavingsDto::toView).toList();
    }

    @PostMapping("/moves/schedule")
    public ResponseEntity<List<SavingsDto.MoveView>> schedule(@RequestParam String monthKey, @RequestParam(required = false) Double totalIncome) {
        var created = service.scheduleMonth(monthKey, totalIncome);
        return ResponseEntity.created(URI.create("/api/v1/savings/moves"))
                .body(created.stream().map(SavingsDto::toView).toList());
    }

    @PostMapping("/moves/{id}/done")
    public ResponseEntity<?> markDone(@PathVariable Long id) {
        if (!moveRepo.existsById(id)) return ResponseEntity.status(404).body(problem(404, "Not found"));
        try {
            var saved = service.markDone(id);
            return ResponseEntity.ok(SavingsDto.toView(saved));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(problem(400, ex.getMessage() == null ? "Invalid request" : ex.getMessage()));
        }
    }

    private static Problem problem(int status, String title) { var p = new Problem(); p.status = status; p.title = title; return p; }
    static class Problem { public String type; public String title; public Integer status; public String detail; public String instance; }
}
