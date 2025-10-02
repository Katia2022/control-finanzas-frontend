package com.finanzas.transactions;

import com.finanzas.accounts.Account;
import com.finanzas.categories.Category;

import java.math.BigDecimal;
import java.time.LocalDate;

public class TransactionDto {
    public static class View {
        public Long id;
        public Transaction.Type type;
        public Long accountId;
        public String accountName;
        public Long categoryId;
        public String categoryName;
        public BigDecimal amount;
        public LocalDate date;
        public String description;
    }

    public static View toView(Transaction t) {
        View v = new View();
        v.id = t.getId();
        v.type = t.getType();
        Account a = t.getAccount();
        if (a != null) { v.accountId = a.getId(); v.accountName = a.getName(); }
        Category c = t.getCategory();
        if (c != null) { v.categoryId = c.getId(); v.categoryName = c.getName(); }
        v.amount = t.getAmount();
        v.date = t.getDate();
        v.description = t.getDescription();
        return v;
    }
}

