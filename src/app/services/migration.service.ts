import { Injectable, inject } from '@angular/core';
import { AccountsApi } from '../api/accounts.api';
import { CategoriesApi } from '../api/categories.api';
import { TransactionsApi, TxType } from '../api/transactions.api';
import { BudgetsApi } from '../api/budgets.api';
import { SettingsApi } from '../api/settings.api';
import { SavingsApi, PlanType, PlanStatus } from '../api/savings.api';

@Injectable({ providedIn: 'root' })
export class MigrationService {
  private readonly accountsApi = inject(AccountsApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly txApi = inject(TransactionsApi);
  private readonly budgetsApi = inject(BudgetsApi);
  private readonly settingsApi = inject(SettingsApi);
  private readonly savingsApi = inject(SavingsApi);

  async migrateIfNeeded(): Promise<void> {
    const FLAG = 'app.migratedToBackend';
    if (localStorage.getItem(FLAG) === 'true') return;
    try {
      // 1) Read local storages
      const accRaw = localStorage.getItem('app.accounts');
      const initialsRaw = localStorage.getItem('app.accounts.initials');
      const catRaw = localStorage.getItem('app.categories');
      const txRaw = localStorage.getItem('app.transactions');
      const budgetCatRaw = localStorage.getItem('app.budget.categories');
      const settingsRaw = localStorage.getItem('app.settings');
      const savingsPlansRaw = localStorage.getItem('app.savings.plans');
      const savingsMovesRaw = localStorage.getItem('app.savings.moves');

      const accounts: string[] = accRaw ? JSON.parse(accRaw) : [];
      const initials: Record<string, number> = initialsRaw ? JSON.parse(initialsRaw) : {};
      const categories: string[] = catRaw ? JSON.parse(catRaw) : [];
      const txs: any[] = txRaw ? JSON.parse(txRaw) : [];
      const budgetMap: Record<string, number> = budgetCatRaw ? JSON.parse(budgetCatRaw) : {};
      const settings = settingsRaw ? JSON.parse(settingsRaw) as { savingsMinRate?: number } : {};
      const savingsPlans: any[] = savingsPlansRaw ? JSON.parse(savingsPlansRaw) : [];
      const savingsMoves: any[] = savingsMovesRaw ? JSON.parse(savingsMovesRaw) : [];

      // 2) Create accounts
      for (const name of accounts) {
        const initial = typeof initials[name] === 'number' ? initials[name] : 0;
        try { await this.accountsApi.create({ name, initialBalance: initial }).toPromise(); } catch {}
      }
      const accList = await this.accountsApi.list().toPromise();
      const accIdByName = new Map((accList || []).map(a => [a.name, a.id] as const));

      // 3) Create categories
      for (const name of categories) { try { await this.categoriesApi.create(name).toPromise(); } catch {} }
      const catList = await this.categoriesApi.list().toPromise();
      const catIdByName = new Map((catList || []).map(c => [c.name, c.id] as const));

      // 4) Transactions
      for (const t of txs) {
        const accountId = accIdByName.get(t.account);
        const categoryId = catIdByName.get(t.category);
        if (!accountId || !categoryId) continue;
        const type: TxType = t.type === 'income' ? 'INCOME' : 'EXPENSE';
        try {
          await this.txApi.create({ type, accountId, categoryId, amount: t.amount, date: t.date, description: t.description }).toPromise();
        } catch {}
      }

      // 5) Budgets (map sin mes -> mes actual)
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      for (const [cat, amount] of Object.entries(budgetMap)) {
        const categoryId = catIdByName.get(cat);
        if (!categoryId) continue;
        try { await this.budgetsApi.upsert(categoryId, monthKey, amount).toPromise(); } catch {}
      }

      // 6) Settings
      if (typeof settings.savingsMinRate === 'number') {
        try { await this.settingsApi.patch({ savingsMinRate: settings.savingsMinRate }).toPromise(); } catch {}
      }

      // 7) Savings plans (moves se programarán desde la UI)
      for (const p of savingsPlans) {
        const type: PlanType = (p.type === 'percent') ? 'PERCENT' : 'FIXED';
        const status: PlanStatus = (p.status === 'paused') ? 'PAUSED' : 'ACTIVE';
        const sourceAccountId = p.sourceAccount ? accIdByName.get(p.sourceAccount) : undefined;
        const targetAccountId = p.targetAccount ? accIdByName.get(p.targetAccount) : undefined;
        try {
          await this.savingsApi.createPlan({
            name: p.name,
            monthKey: p.monthKey,
            type,
            amountPlanned: p.amountPlanned || 0,
            percent: p.percent ?? undefined,
            priority: p.priority ?? 1,
            status,
            sourceAccountId, targetAccountId,
          }).toPromise();
        } catch {}
      }

      // Nota: no migramos savingsMoves uno a uno (no hay endpoint de creación directa). Podrás programarlos con el botón en la UI.

      // 8) Clear local storage & set flag
      const keys = [
        'app.accounts','app.accounts.initials','app.categories','app.transactions','app.currency','app.budget.fixed','app.budget.categories','app.settings','app.savings.plans','app.savings.moves'
      ];
      for (const k of keys) localStorage.removeItem(k);
      localStorage.setItem(FLAG, 'true');
    } catch (e) {
      // If migration partially fails, don't set the flag; allow retry on next load
      console.error('Migration failed', e);
    }
  }
}

