import { Injectable, computed, inject, signal } from '@angular/core';
import { CategoriesService } from './categories.service';
import { AccountsService } from './accounts.service';
import { SettingsService } from './settings.service';
import { BudgetService } from './budget.service';

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
  description?: string;
  amount: number;
  date: string; // ISO yyyy-MM-dd
}

export interface MonthlySummary {
  key: string;
  label: string;
  income: number;
  expense: number;
}

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private readonly categoriesSvc = inject(CategoriesService);
  private readonly accountsSvc = inject(AccountsService);
  private readonly settingsSvc = inject(SettingsService);
  private readonly budgetSvc = inject(BudgetService);

  private nextId = 1;
  private static readonly TX_KEY = 'app.transactions';
  private static readonly CURR_KEY = 'app.currency';

  private buildTransaction(
    type: Transaction['type'],
    category: string,
    account: string,
    description: string,
    amount: number,
    date: string,
  ): Transaction {
    return {
      id: this.nextId++,
      type,
      category,
      account,
      description,
      amount,
      date,
    };
  }

  readonly currencyCode = signal<'MXN' | 'USD' | 'EUR'>(this.loadCurrency());
  readonly locale = 'pt-PT';
  readonly transactions = signal<Transaction[]>(this.loadTransactions());

  constructor() {
    // Seed categories from transactions if empty
    if (this.categoriesSvc.categories().length === 0 && this.transactions().length) {
      const unique = Array.from(new Set(this.transactions().map(t => t.category)))
        .sort((a, b) => a.localeCompare(b));
      unique.forEach(c => this.categoriesSvc.add(c));
    }

    // Seed accounts from transactions if empty
    if (this.accountsSvc.accounts().length === 0 && this.transactions().length) {
      const unique = Array.from(new Set(this.transactions().map(t => t.account)))
        .sort((a, b) => a.localeCompare(b));
      unique.forEach(a => this.accountsSvc.add(a));
    }

    // Ensure nextId continues from stored transactions
    const maxId = this.transactions().reduce((m, t) => Math.max(m, t.id), 0);
    this.nextId = Math.max(1, maxId + 1);
  }

  // Computed values
  readonly orderedTransactions = computed(() => {
    return [...this.transactions()].sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.id - a.id;
    });
  });

  readonly totalIncome = computed(() =>
    this.transactions()
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
  );

  readonly totalExpense = computed(() =>
    this.transactions()
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
  );

  readonly initialTotal = computed(() => {
    const map = this.accountsSvc.initialBalances();
    return Object.values(map).reduce((a, b) => a + (Number.isFinite(b) ? (b as number) : 0), 0);
  });

  readonly balance = computed(() => this.initialTotal() + this.totalIncome() - this.totalExpense());

  readonly currentMonthKey = computed(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  readonly monthExpenseTotal = computed(() => {
    const key = this.currentMonthKey();
    let total = 0;
    for (const t of this.transactions()) {
      if (t.type !== 'expense') continue;
      const d = new Date(t.date + 'T00:00');
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (k === key) total += t.amount;
    }
    return total;
  });

  readonly monthBudgetTotal = computed(() => {
    const map = this.budgetSvc.categoryBudgets();
    return Object.values(map).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  });

  readonly savingsRate = computed(() => {
    const income = this.totalIncome();
    if (!income) return 0;
    return this.balance() / income;
  });

  readonly monthlySummaries = computed<MonthlySummary[]>(() => {
    const formatter = new Intl.DateTimeFormat(this.locale, { month: 'long', year: 'numeric' });
    const groups = new Map<string, MonthlySummary>();
    for (const t of this.transactions()) {
      const date = new Date(t.date + 'T00:00');
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups.has(key)) {
        groups.set(key, { key, label: formatter.format(date), income: 0, expense: 0 });
      }
      const summary = groups.get(key)!;
      if (t.type === 'income') summary.income += t.amount; else summary.expense += t.amount;
    }
    return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
  });

  readonly expenseByCategory = computed(() => {
    const categories = new Map<string, number>();
    for (const t of this.transactions()) {
      if (t.type === 'expense') {
        categories.set(t.category, (categories.get(t.category) ?? 0) + t.amount);
      }
    }
    return [...categories.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  readonly expenseByAccount = computed(() => {
    const accounts = new Map<string, number>();
    for (const t of this.transactions()) {
      if (t.type === 'expense') {
        const acc = t.account || 'General';
        accounts.set(acc, (accounts.get(acc) ?? 0) + t.amount);
      }
    }
    return [...accounts.entries()]
      .map(([account, amount]) => ({ account, amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  readonly accountTotals = computed(() => {
    const map = new Map<string, { account: string; income: number; expense: number; balance: number; initial: number }>();
    const initials = this.accountsSvc.initialBalances();
    for (const t of this.transactions()) {
      const acc = t.account || 'General';
      if (!map.has(acc)) map.set(acc, { account: acc, income: 0, expense: 0, balance: 0, initial: Number(initials[acc] ?? 0) });
      const ref = map.get(acc)!;
      if (t.type === 'income') ref.income += t.amount; else ref.expense += t.amount;
      ref.balance = ref.initial + ref.income - ref.expense;
    }
    return [...map.values()].sort((a, b) => (b.expense - a.expense) || (b.income - a.income));
  });

  readonly insight = computed(() => {
    if (!this.transactions().length) {
      return 'Todavía no registras movimientos. Empieza agregando tus ingresos y gastos más recientes.';
    }
    if (this.balance() < 0) {
      return 'Tus gastos superan a los ingresos. Revisa las categorías más altas y reduce aquellas que no sean esenciales.';
    }
    if (this.monthBudgetTotal() > 0 && this.monthExpenseTotal() > this.monthBudgetTotal()) {
      const diff = this.monthExpenseTotal() - this.monthBudgetTotal();
      return `Has superado tu presupuesto mensual por ${diff.toLocaleString(this.locale, { style: 'currency', currency: this.currencyCode() })}. Revisa tus gastos o ajusta tu planificación.`;
    }
    const min = this.settingsSvc.settings().savingsMinRate;
    if (this.savingsRate() < min) {
      const pct = Math.round(min * 100);
      return `Considera destinar al menos el ${pct}% de tus ingresos al ahorro. Ajusta pequeños gastos para incrementar tu colchón.`;
    }
    return '¡Vas por buen camino! Mantén el seguimiento de tus gastos para seguir cumpliendo tus metas financieras.';
  });

  // Actions
  addTransaction(t: Omit<Transaction, 'id'>) {
    const tx: Transaction = { id: this.nextId++, ...t };
    this.transactions.update((curr) => [tx, ...curr]);
    this.saveTransactions();
    this.categoriesSvc.ensure(tx.category);
    this.accountsSvc.ensure(tx.account);
  }

  removeTransaction(id: number) {
    this.transactions.update((curr) => curr.filter(t => t.id !== id));
    this.saveTransactions();
  }

  renameCategory(prev: string, next: string) {
    if (!prev || !next || prev === next) return;
    this.transactions.update((current) => current.map((t) => (t.category === prev ? { ...t, category: next } : t)));
    this.saveTransactions();
    const budgets = this.budgetSvc.categoryBudgets();
    if (budgets[prev] != null) {
      const value = budgets[prev];
      this.budgetSvc.setCategoryBudget(next, value);
      this.budgetSvc.removeCategoryBudget(prev);
    }
  }

  removeCategory(name: string) {
    this.budgetSvc.removeCategoryBudget(name);
  }

  renameAccount(prev: string, next: string) {
    if (!prev || !next || prev === next) return;
    this.transactions.update((current) => current.map((t) => (t.account === prev ? { ...t, account: next } : t)));
    this.saveTransactions();
  }

  removeAccount(_name: string) {
    // Intentionally left blank: removing an account does not alter past transactions.
  }

  setCurrency(code: 'MXN' | 'USD' | 'EUR') {
    this.currencyCode.set(code);
    try { localStorage.setItem(TransactionsService.CURR_KEY, code); } catch {}
  }

  private saveTransactions() {
    try {
      localStorage.setItem(TransactionsService.TX_KEY, JSON.stringify(this.transactions()));
    } catch {}
  }

  private loadTransactions(): Transaction[] {
    try {
      const raw = localStorage.getItem(TransactionsService.TX_KEY);
      if (raw) {
        const list = JSON.parse(raw) as any[];
        // Migrate older records without account
        return list.map((t, idx) => ({
          id: t.id ?? (idx + 1),
          type: t.type,
          category: t.category,
          account: t.account || 'General',
          description: t.description,
          amount: t.amount,
          date: t.date,
        })) as Transaction[];
      }
    } catch {}
    // Fallback seed data on first load
    return [
      this.buildTransaction('income', 'Salario', 'Nómina', 'Pago mensual', 28000, '2024-06-28'),
      this.buildTransaction('expense', 'Vivienda', 'Tarjeta', 'Renta departamento', 9500, '2024-07-01'),
      this.buildTransaction('expense', 'Transporte', 'Efectivo', 'Gasolina y mantenimiento', 1800, '2024-07-03'),
      this.buildTransaction('income', 'Freelance', 'Nómina', 'Proyecto de diseño', 4200, '2024-07-08'),
      this.buildTransaction('expense', 'Alimentos', 'Tarjeta', 'Supermercado semanal', 2200, '2024-07-11'),
      this.buildTransaction('expense', 'Servicios', 'Nómina', 'Luz e internet', 1350, '2024-07-12'),
      this.buildTransaction('income', 'Reembolso', 'Efectivo', 'Devolución de impuestos', 3500, '2024-04-20'),
      this.buildTransaction('expense', 'Entretenimiento', 'Tarjeta', 'Suscripciones', 650, '2024-06-15'),
      this.buildTransaction('expense', 'Salud', 'Efectivo', 'Consulta médica', 900, '2024-05-18'),
    ];
  }

  private loadCurrency(): 'MXN' | 'USD' | 'EUR' {
    try {
      const raw = localStorage.getItem(TransactionsService.CURR_KEY);
      if (raw === 'MXN' || raw === 'USD' || raw === 'EUR') return raw;
    } catch {}
    return 'EUR';
  }
}
