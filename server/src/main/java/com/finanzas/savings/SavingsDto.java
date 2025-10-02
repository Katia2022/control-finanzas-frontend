package com.finanzas.savings;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public class SavingsDto {
    // Plan DTOs
    public static class PlanCreate {
        @NotBlank @Size(max = 100) public String name;
        @Pattern(regexp = "^[0-9]{4}-[0-9]{2}$") public String monthKey;
        @NotNull public SavingsPlan.Type type;
        @NotNull public Double amountPlanned;
        @DecimalMin("0.0") @DecimalMax("1.0") public Double percent;
        @Min(1) public Integer priority = 1;
        public SavingsPlan.Status status = SavingsPlan.Status.ACTIVE;
        public Long sourceAccountId; public Long targetAccountId;
    }

    public static class PlanUpdate {
        public String name; public SavingsPlan.Type type; public Double amountPlanned; public Double percent; public Integer priority; public SavingsPlan.Status status; public Long sourceAccountId; public Long targetAccountId;
    }

    public static class PlanView {
        public Long id; public String name; public String monthKey; public SavingsPlan.Type type; public Double amountPlanned; public Double percent; public Integer priority; public SavingsPlan.Status status; public Long sourceAccountId; public Long targetAccountId;
    }

    static PlanView toView(SavingsPlan p) {
        PlanView v = new PlanView();
        v.id = p.getId(); v.name = p.getName(); v.monthKey = p.getMonthKey(); v.type = p.getType();
        v.amountPlanned = p.getAmountPlanned() == null ? 0.0 : p.getAmountPlanned().doubleValue();
        v.percent = p.getPercent() == null ? null : p.getPercent().doubleValue();
        v.priority = p.getPriority(); v.status = p.getStatus();
        v.sourceAccountId = p.getSourceAccount() == null ? null : p.getSourceAccount().getId();
        v.targetAccountId = p.getTargetAccount() == null ? null : p.getTargetAccount().getId();
        return v;
    }

    // Move DTOs
    public static class MoveView {
        public Long id; public Long planId; public LocalDate date; public Double amount; public SavingsMove.Status status; public String note;
    }

    static MoveView toView(SavingsMove m) {
        MoveView v = new MoveView();
        v.id = m.getId(); v.planId = m.getPlan().getId(); v.date = m.getDate(); v.amount = m.getAmount() == null ? 0.0 : m.getAmount().doubleValue(); v.status = m.getStatus(); v.note = m.getNote();
        return v;
    }
}
