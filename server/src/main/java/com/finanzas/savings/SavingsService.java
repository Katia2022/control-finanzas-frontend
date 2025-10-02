package com.finanzas.savings;

import com.finanzas.accounts.AccountRepository;
import com.finanzas.categories.Category;
import com.finanzas.categories.CategoryRepository;
import com.finanzas.transactions.Transaction;
import com.finanzas.transactions.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
public class SavingsService {
    private final SavingsPlanRepository planRepo;
    private final SavingsMoveRepository moveRepo;
    private final AccountRepository accountRepo;
    private final TransactionRepository txRepo;
    private final CategoryRepository categoryRepo;

    public SavingsService(SavingsPlanRepository planRepo, SavingsMoveRepository moveRepo, AccountRepository accountRepo,
                          TransactionRepository txRepo, CategoryRepository categoryRepo) {
        this.planRepo = planRepo; this.moveRepo = moveRepo; this.accountRepo = accountRepo; this.txRepo = txRepo; this.categoryRepo = categoryRepo;
    }

    @Transactional
    public SavingsPlan createPlan(SavingsDto.PlanCreate body) {
        SavingsPlan p = new SavingsPlan();
        p.setName(body.name.trim());
        p.setMonthKey(body.monthKey);
        p.setType(body.type);
        p.setAmountPlanned(java.math.BigDecimal.valueOf(body.amountPlanned));
        if (body.percent != null) p.setPercent(java.math.BigDecimal.valueOf(body.percent));
        p.setPriority(body.priority == null ? 1 : body.priority);
        p.setStatus(body.status == null ? SavingsPlan.Status.ACTIVE : body.status);
        if (body.sourceAccountId != null) {
            var acc = accountRepo.findById(body.sourceAccountId).orElseThrow();
            if (acc.getType() != com.finanzas.accounts.Account.Type.OPERATIVA)
                throw new IllegalArgumentException("sourceAccount must be OPERATIVA");
            p.setSourceAccount(acc);
        }
        if (body.targetAccountId != null) {
            var acc = accountRepo.findById(body.targetAccountId).orElseThrow();
            if (acc.getType() != com.finanzas.accounts.Account.Type.AHORRO)
                throw new IllegalArgumentException("targetAccount must be AHORRO");
            p.setTargetAccount(acc);
        }
        return planRepo.save(p);
    }

    @Transactional
    public SavingsPlan updatePlan(Long id, SavingsDto.PlanUpdate body) {
        SavingsPlan p = planRepo.findById(id).orElseThrow();
        if (body.name != null) p.setName(body.name.trim());
        if (body.type != null) p.setType(body.type);
        if (body.amountPlanned != null) p.setAmountPlanned(java.math.BigDecimal.valueOf(body.amountPlanned));
        if (body.percent != null) p.setPercent(java.math.BigDecimal.valueOf(body.percent));
        if (body.priority != null) p.setPriority(body.priority);
        if (body.status != null) p.setStatus(body.status);
        if (body.sourceAccountId != null) {
            var acc = accountRepo.findById(body.sourceAccountId).orElseThrow();
            if (acc.getType() != com.finanzas.accounts.Account.Type.OPERATIVA)
                throw new IllegalArgumentException("sourceAccount must be OPERATIVA");
            p.setSourceAccount(acc);
        }
        if (body.targetAccountId != null) {
            var acc = accountRepo.findById(body.targetAccountId).orElseThrow();
            if (acc.getType() != com.finanzas.accounts.Account.Type.AHORRO)
                throw new IllegalArgumentException("targetAccount must be AHORRO");
            p.setTargetAccount(acc);
        }
        return planRepo.save(p);
    }

    @Transactional
    public void deletePlan(Long id) { planRepo.deleteById(id); }

    @Transactional
    public List<SavingsMove> scheduleMonth(String monthKey, Double totalIncome) {
        List<SavingsPlan> plans = planRepo.findByMonthKey(monthKey);
        List<SavingsMove> created = new ArrayList<>();
        LocalDate date = YearMonth.parse(monthKey).atDay(1);
        for (SavingsPlan p : plans) {
            double amount = p.getType() == SavingsPlan.Type.FIXED ? (p.getAmountPlanned() == null ? 0.0 : p.getAmountPlanned().doubleValue()) :
                    Math.round((((p.getPercent() == null ? java.math.BigDecimal.ZERO : p.getPercent()).doubleValue()) * (totalIncome == null ? 0 : totalIncome)) * 100.0) / 100.0;
            if (amount <= 0) continue;
            SavingsMove m = new SavingsMove();
            m.setPlan(p);
            m.setDate(date);
            m.setAmount(java.math.BigDecimal.valueOf(amount));
            m.setStatus(SavingsMove.Status.PENDING);
            created.add(moveRepo.save(m));
        }
        return created;
    }

    @Transactional
    public SavingsMove markDone(Long id) {
        SavingsMove m = moveRepo.findById(id).orElseThrow();
        if (m.getStatus() == SavingsMove.Status.DONE) return m;
        SavingsPlan p = m.getPlan();
        if (p == null) throw new IllegalArgumentException("Move without plan");
        if (p.getSourceAccount() == null || p.getTargetAccount() == null) {
            throw new IllegalArgumentException("Plan must define source and target accounts");
        }

        // Ensure category 'Ahorro' exists
        Category ahorro = categoryRepo.findAll().stream()
                .filter(c -> "Ahorro".equalsIgnoreCase(c.getName()))
                .findFirst()
                .orElseGet(() -> {
                    Category c = new Category(); c.setName("Ahorro"); return categoryRepo.save(c);
                });

        // Create expense from source and income into target
        var amount = m.getAmount() == null ? java.math.BigDecimal.ZERO : m.getAmount();
        Transaction tExpense = new Transaction();
        tExpense.setType(Transaction.Type.EXPENSE);
        tExpense.setAccount(p.getSourceAccount());
        tExpense.setCategory(ahorro);
        tExpense.setAmount(amount);
        tExpense.setDate(m.getDate());
        tExpense.setDescription("Ahorro: " + p.getName());

        Transaction tIncome = new Transaction();
        tIncome.setType(Transaction.Type.INCOME);
        tIncome.setAccount(p.getTargetAccount());
        tIncome.setCategory(ahorro);
        tIncome.setAmount(amount);
        tIncome.setDate(m.getDate());
        tIncome.setDescription("Ahorro: " + p.getName());

        txRepo.save(tExpense);
        txRepo.save(tIncome);

        m.setStatus(SavingsMove.Status.DONE);
        return moveRepo.save(m);
    }
}
