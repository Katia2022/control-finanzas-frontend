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
        return Map.of(
                "savingsMinRate", savingsMinRate,
                "currencyCode", currencyCode
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
        return ResponseEntity.ok(get());
    }

    private static double parseDouble(String s, double def) {
        try { return Double.parseDouble(s); } catch (Exception e) { return def; }
    }
}
