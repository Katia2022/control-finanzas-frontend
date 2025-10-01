package com.finanzas.accounts;

import jakarta.validation.constraints.*;

public class AccountDto {
    public static class Create {
        @NotBlank @Size(max = 100)
        public String name;
        public Double initialBalance = 0.0;
        public String type; // OPERATIVA or AHORRO
    }

    public static class Update {
        @Size(max = 100)
        public String name;
        public Double initialBalance;
        public String type; // optional
    }

    public static class View {
        public Long id;
        public String name;
        public Double initialBalance;
        public String type;
    }

    static View toView(Account a) {
        View v = new View();
        v.id = a.getId();
        v.name = a.getName();
        v.initialBalance = a.getInitialBalance() == null ? 0.0 : a.getInitialBalance().doubleValue();
        v.type = a.getType() == null ? "OPERATIVA" : a.getType().name();
        return v;
    }
}
