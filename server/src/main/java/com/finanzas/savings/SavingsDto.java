package com.finanzas.savings;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public class SavingsDto {
    // Transfer DTOs (ad-hoc)
    public static class AdHocCreate {
        @NotNull public Long sourceAccountId;
        @NotNull public Long targetAccountId;
        @NotNull public LocalDate date;
        @NotNull @DecimalMin("0.01") public Double amount;
        @Size(max = 120) public String note;
    }

    public static class AdHocResult {
        public Long expenseTransactionId;
        public Long incomeTransactionId;
    }
}
