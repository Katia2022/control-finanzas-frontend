package com.finanzas.transactions;

import com.finanzas.accounts.AccountRepository;
import com.finanzas.categories.CategoryRepository;
import com.finanzas.common.Constants;
import com.finanzas.common.NotFoundException;
import com.finanzas.settings.SettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {
    private final TransactionRepository repo;
    private final AccountRepository accountRepo;
    private final CategoryRepository categoryRepo;
    private final SettingRepository settingRepo;

    @Transactional(readOnly = true)
    public List<TransactionDto.View> list(String monthKey) {
        if (monthKey == null) return repo.findAll().stream().map(TransactionDto::toView).toList();
        YearMonth ym = YearMonth.parse(monthKey);
        int cutoff = settingRepo.findById(Constants.SETTINGS_MONTH_CUTOFF_DAY)
                .map(s -> parseInt(s.getValueJson(), Constants.DEFAULT_MONTH_CUTOFF_DAY))
                .orElse(Constants.DEFAULT_MONTH_CUTOFF_DAY);
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

    @Transactional
    public TransactionDto.View create(TransactionDto.Create body) {
        var t = new Transaction();
        t.setType(body.type);
        t.setAccount(accountRepo.findById(body.accountId).orElseThrow(NotFoundException::new));
        t.setCategory(categoryRepo.findById(body.categoryId).orElseThrow(NotFoundException::new));
        t.setAmount(java.math.BigDecimal.valueOf(body.amount));
        t.setDate(parseDate(body.date));
        t.setDescription(body.description);
        repo.save(t);
        return TransactionDto.toView(t);
    }

    @Transactional
    public TransactionDto.View update(Long id, TransactionDto.Update body) {
        var t = repo.findById(id).orElseThrow(NotFoundException::new);
        if (body.type != null) t.setType(body.type);
        if (body.accountId != null) t.setAccount(accountRepo.findById(body.accountId).orElseThrow(NotFoundException::new));
        if (body.categoryId != null) t.setCategory(categoryRepo.findById(body.categoryId).orElseThrow(NotFoundException::new));
        if (body.amount != null) t.setAmount(java.math.BigDecimal.valueOf(body.amount));
        if (body.date != null) t.setDate(parseDate(body.date));
        if (body.description != null) t.setDescription(body.description);
        repo.save(t);
        return TransactionDto.toView(t);
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) throw new NotFoundException();
        repo.deleteById(id);
    }

    private static int parseInt(String s, int def) {
        try { return Integer.parseInt(s); } catch (Exception e) { return def; }
    }

    private static LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) throw new IllegalArgumentException(Constants.ERR_DATE_REQUIRED);
        try {
            // Expecting yyyy-MM-dd
            return LocalDate.parse(s);
        } catch (Exception ignored) { }
        try {
            // ISO date-time like 2025-09-25T23:00:00.000Z
            return java.time.OffsetDateTime.parse(s).toLocalDate();
        } catch (Exception ignored) { }
        try {
            return java.time.LocalDateTime.parse(s, java.time.format.DateTimeFormatter.ISO_DATE_TIME).toLocalDate();
        } catch (Exception e) {
            throw new IllegalArgumentException(Constants.ERR_INVALID_DATE_FORMAT);
        }
    }

    public static class NotFound extends RuntimeException {}
}
