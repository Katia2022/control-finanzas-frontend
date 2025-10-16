package com.finanzas.budgets;

import com.finanzas.categories.CategoryRepository;
import com.finanzas.common.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetCategoryService {
    private final BudgetCategoryRepository repo;
    private final CategoryRepository categoryRepo;

    @Transactional(readOnly = true)
    public List<BudgetCategoryDto.View> list(String monthKey) {
        var list = monthKey == null ? repo.findAll() : repo.findByMonthKey(monthKey);
        return list.stream().map(BudgetCategoryDto::toView).toList();
    }

    @Transactional
    public BudgetCategoryDto.View upsert(Long categoryId, String monthKey, Double amount) {
        var existing = repo.findByCategory_IdAndMonthKey(categoryId, monthKey).orElse(null);
        BudgetCategory b = existing == null ? new BudgetCategory() : existing;
        b.setCategory(categoryRepo.findById(categoryId).orElseThrow(NotFoundException::new));
        b.setMonthKey(monthKey);
        b.setAmount(java.math.BigDecimal.valueOf(amount));
        repo.save(b);
        return BudgetCategoryDto.toView(b);
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) throw new NotFoundException();
        repo.deleteById(id);
    }
}
