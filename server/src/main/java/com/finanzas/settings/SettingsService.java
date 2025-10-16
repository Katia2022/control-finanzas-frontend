package com.finanzas.settings;

import com.finanzas.common.Constants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettingsService {
    private final SettingRepository repo;

    @Transactional(readOnly = true)
    public Map<String, Object> get() {
        double savingsMinRate = repo.findById(Constants.SETTINGS_SAVINGS_MIN_RATE)
                .map(s -> parseDouble(s.getValueJson(), Constants.DEFAULT_SAVINGS_MIN_RATE))
                .orElse(Constants.DEFAULT_SAVINGS_MIN_RATE);
        String currencyCode = repo.findById(Constants.SETTINGS_CURRENCY_CODE)
                .map(Setting::getValueJson)
                .orElse(Constants.DEFAULT_CURRENCY_CODE);
        int monthCutoffDay = repo.findById(Constants.SETTINGS_MONTH_CUTOFF_DAY)
                .map(s -> parseInt(s.getValueJson(), Constants.DEFAULT_MONTH_CUTOFF_DAY))
                .orElse(Constants.DEFAULT_MONTH_CUTOFF_DAY);
        return Map.of(
                Constants.SETTINGS_SAVINGS_MIN_RATE, savingsMinRate,
                Constants.SETTINGS_CURRENCY_CODE, currencyCode,
                Constants.SETTINGS_MONTH_CUTOFF_DAY, monthCutoffDay
        );
    }

    @Transactional
    public Map<String, Object> patch(Map<String, Object> body) {
        if (body.containsKey(Constants.SETTINGS_SAVINGS_MIN_RATE)) {
            var v = String.valueOf(body.get(Constants.SETTINGS_SAVINGS_MIN_RATE));
            var s = new Setting(); s.setKey(Constants.SETTINGS_SAVINGS_MIN_RATE); s.setValueJson(v); repo.save(s);
        }
        if (body.containsKey(Constants.SETTINGS_CURRENCY_CODE)) {
            var v = String.valueOf(body.get(Constants.SETTINGS_CURRENCY_CODE));
            if (v == null || v.isBlank()) v = Constants.FALLBACK_CURRENCY_CODE_IF_BLANK;
            var s = new Setting(); s.setKey(Constants.SETTINGS_CURRENCY_CODE); s.setValueJson(v); repo.save(s);
        }
        if (body.containsKey(Constants.SETTINGS_MONTH_CUTOFF_DAY)) {
            var v = String.valueOf(body.get(Constants.SETTINGS_MONTH_CUTOFF_DAY));
            int day = parseInt(v, Constants.DEFAULT_MONTH_CUTOFF_DAY);
            if (day < 1) day = 1; if (day > 31) day = 31;
            var s = new Setting(); s.setKey(Constants.SETTINGS_MONTH_CUTOFF_DAY); s.setValueJson(String.valueOf(day)); repo.save(s);
        }
        return get();
    }

    private static double parseDouble(String s, double def) {
        try { return Double.parseDouble(s); } catch (Exception e) { return def; }
    }

    private static int parseInt(String s, int def) {
        try { return Integer.parseInt(s); } catch (Exception e) { return def; }
    }
}
