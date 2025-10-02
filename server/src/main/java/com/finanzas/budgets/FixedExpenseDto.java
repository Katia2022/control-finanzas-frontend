package com.finanzas.budgets;

import com.finanzas.categories.Category;

public class FixedExpenseDto {
    public static class View {
        public Long id;
        public String name;
        public Double amount;
        public CategoryRef category;
    }

    public static class CategoryRef { public Long id; public String name; }

    public static View toView(FixedExpense f) {
        View v = new View();
        v.id = f.getId();
        v.name = f.getName();
        v.amount = f.getAmount() == null ? 0.0 : f.getAmount().doubleValue();
        Category c = f.getCategory();
        if (c != null) { var cr = new CategoryRef(); cr.id = c.getId(); cr.name = c.getName(); v.category = cr; }
        return v;
    }
}

