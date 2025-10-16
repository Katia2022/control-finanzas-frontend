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
public class FixedExpenseService {
    private final FixedExpenseRepository repo;
    private final CategoryRepository categoryRepo;

    @Transactional(readOnly = true)
    public List<FixedExpenseDto.View> list() {
        return repo.findAll().stream().map(FixedExpenseDto::toView).toList();
    }

    @Transactional
    public FixedExpenseDto.View create(String name, Double amount, Long categoryId) {
        FixedExpense f = new FixedExpense();
        f.setName(name.trim());
        f.setAmount(java.math.BigDecimal.valueOf(amount));
        if (categoryId != null) f.setCategory(categoryRepo.findById(categoryId).orElse(null));
        repo.save(f);
        return FixedExpenseDto.toView(f);
    }

    @Transactional
    public FixedExpenseDto.View update(Long id, String name, Double amount, Long categoryId) {
        FixedExpense f = repo.findById(id).orElseThrow(NotFoundException::new);
        if (name != null) f.setName(name.trim());
        if (amount != null) f.setAmount(java.math.BigDecimal.valueOf(amount));
        if (categoryId != null) f.setCategory(categoryRepo.findById(categoryId).orElse(null));
        repo.save(f);
        return FixedExpenseDto.toView(f);
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) throw new NotFoundException();
        repo.deleteById(id);
    }
}
