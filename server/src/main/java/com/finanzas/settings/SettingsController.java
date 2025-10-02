package com.finanzas.settings;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingsController {
    private final SettingRepository repo;
    public SettingsController(SettingRepository repo) { this.repo = repo; }

    @GetMapping
    public Map<String, Object> get() {
        double savingsMinRate = repo.findById("savingsMinRate").map(s -> parseDouble(s.getValueJson(), 0.1)).orElse(0.1);
        String currencyCode = repo.findById("currencyCode").map(Setting::getValueJson).orElse("EUR");
        int monthCutoffDay = repo.findById("monthCutoffDay").map(s -> parseInt(s.getValueJson(), 1)).orElse(1);
        return Map.of(
                "savingsMinRate", savingsMinRate,
                "currencyCode", currencyCode,
                "monthCutoffDay", monthCutoffDay
        );
    }

    @PatchMapping
    public ResponseEntity<?> patch(@RequestBody Map<String, Object> body) {
        if (body.containsKey("savingsMinRate")) {
            var v = String.valueOf(body.get("savingsMinRate"));
            var s = new Setting(); s.setKey("savingsMinRate"); s.setValueJson(v); repo.save(s);
        }
        if (body.containsKey("currencyCode")) {
            var v = String.valueOf(body.get("currencyCode"));
            if (v == null || v.isBlank()) v = "MXN";
            var s = new Setting(); s.setKey("currencyCode"); s.setValueJson(v); repo.save(s);
        }
        if (body.containsKey("monthCutoffDay")) {
            var v = String.valueOf(body.get("monthCutoffDay"));
            int day = parseInt(v, 1);
            if (day < 1) day = 1; if (day > 31) day = 31;
            var s = new Setting(); s.setKey("monthCutoffDay"); s.setValueJson(String.valueOf(day)); repo.save(s);
        }
        return ResponseEntity.ok(get());
    }

    private static double parseDouble(String s, double def) {
        try { return Double.parseDouble(s); } catch (Exception e) { return def; }
    }

    private static int parseInt(String s, int def) {
        try { return Integer.parseInt(s); } catch (Exception e) { return def; }
    }
}
