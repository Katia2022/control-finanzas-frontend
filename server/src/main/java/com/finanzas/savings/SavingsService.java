package com.finanzas.savings;

import com.finanzas.accounts.AccountRepository;
import com.finanzas.categories.Category;
import com.finanzas.categories.CategoryRepository;
import com.finanzas.common.Constants;
import com.finanzas.transactions.Transaction;
import com.finanzas.transactions.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavingsService {
    private final AccountRepository accountRepo;
    private final TransactionRepository txRepo;
    private final CategoryRepository categoryRepo;

    @Transactional
    public SavingsDto.AdHocResult executeTransfer(SavingsDto.AdHocCreate body) {
        if (body.amount == null || body.amount <= 0.0) throw new IllegalArgumentException(Constants.ERR_AMOUNT_POSITIVE);
        var source = accountRepo.findById(body.sourceAccountId).orElseThrow();
        var target = accountRepo.findById(body.targetAccountId).orElseThrow();
        // Allow both directions: OPERATIVA -> AHORRO (deposit) and AHORRO -> OPERATIVA (withdraw)
        boolean isDeposit = source.getType() == com.finanzas.accounts.Account.Type.OPERATIVA
                && target.getType() == com.finanzas.accounts.Account.Type.AHORRO;
        boolean isWithdraw = source.getType() == com.finanzas.accounts.Account.Type.AHORRO
                && target.getType() == com.finanzas.accounts.Account.Type.OPERATIVA;
        if (!(isDeposit || isWithdraw)) {
            throw new IllegalArgumentException(Constants.ERR_SOURCE_TARGET_TYPES);
        }

        // Ensure category 'Transferencia interna' (used to tag internal transfers)
        Category catTransfer = categoryRepo.findAll().stream()
                .filter(c -> Constants.CATEGORY_INTERNAL_TRANSFER.equalsIgnoreCase(c.getName()))
                .findFirst()
                .orElseGet(() -> { var c = new Category(); c.setName(Constants.CATEGORY_INTERNAL_TRANSFER); return categoryRepo.save(c); });

        var amount = java.math.BigDecimal.valueOf(body.amount);
        var date = body.date;
        var desc = (body.note == null || body.note.isBlank()) ? Constants.SAVINGS_DEFAULT_NOTE : body.note.trim();

        Transaction tExpense = new Transaction();
        tExpense.setType(Transaction.Type.EXPENSE);
        tExpense.setAccount(source);
        tExpense.setCategory(catTransfer);
        tExpense.setAmount(amount);
        tExpense.setDate(date);
        tExpense.setDescription(desc);

        Transaction tIncome = new Transaction();
        tIncome.setType(Transaction.Type.INCOME);
        tIncome.setAccount(target);
        tIncome.setCategory(catTransfer);
        tIncome.setAmount(amount);
        tIncome.setDate(date);
        tIncome.setDescription(desc);

        txRepo.save(tExpense);
        txRepo.save(tIncome);

        var res = new SavingsDto.AdHocResult();
        res.expenseTransactionId = tExpense.getId();
        res.incomeTransactionId = tIncome.getId();
        return res;
    }
}
