package com.finanzas.settings;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingsController {
    private final SettingsService service;

    @GetMapping
    public Map<String, Object> get() { return service.get(); }

    @PatchMapping
    public ResponseEntity<?> patch(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.patch(body));
    }

    // parsing moved to service
}
