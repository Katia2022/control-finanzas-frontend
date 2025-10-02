package com.finanzas.budgets;

import com.finanzas.categories.Category;

public class BudgetCategoryDto {
    public static class View {
        public Long id;
        public String monthKey;
        public Double amount;
        public CategoryRef category;
    }

    public static class CategoryRef { public Long id; public String name; }

    public static View toView(BudgetCategory b) {
        View v = new View();
        v.id = b.getId();
        v.monthKey = b.getMonthKey();
        v.amount = b.getAmount() == null ? 0.0 : b.getAmount().doubleValue();
        Category c = b.getCategory();
        if (c != null) { var cr = new CategoryRef(); cr.id = c.getId(); cr.name = c.getName(); v.category = cr; }
        return v;
    }
}

