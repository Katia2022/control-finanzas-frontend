import { Injectable, computed, inject, signal } from '@angular/core';
import { CategoriesService } from './categories.service';
import { AccountsService } from './accounts.service';
import { SettingsService } from './settings.service';
import { BudgetService } from './budget.service';
import { TransactionsApi, TransactionDTO } from '../api/transactions.api';
import { CategoriesApi } from '../api/categories.api';
import { AccountsApi, AccountView } from '../api/accounts.api';
import { TransactionsStore } from '../state/transactions.store';

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
  private readonly txApi = inject(TransactionsApi);
  private readonly catsApi = inject(CategoriesApi);
  private readonly accApi = inject(AccountsApi);
  private catIdByName = new Map<string, number>();
  private accIdByName = new Map<string, number>();
  readonly accounts = signal<AccountView[]>([]);
  private readonly initials = signal<Record<string, number>>({});
  readonly accountTypeByName = computed(() => {
    const map = new Map<string, 'OPERATIVA' | 'AHORRO'>();
    for (const a of this.accounts()) map.set(a.name, a.type);
    return map;
  });

  private buildTransaction(
    type: Transaction['type'],
    category: string,
    account: string,
    description: string,
    amount: number,
    date: string
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

  readonly currencyCode = computed(() => this.settingsSvc.settings().currencyCode);
  readonly locale = 'es-ES';
  readonly transactions = signal<Transaction[]>([]);
  // Histórico completo para calcular saldos de apertura por periodo
  readonly allTransactions = signal<Transaction[]>([]);
  readonly lastError = signal<string | null>(null);
  readonly lastInfo = signal<string | null>(null);
  readonly txLoading = signal(false);
  readonly historyLoading = signal(false);
  readonly accLoading = signal(false);
  readonly listError = signal<string | null>(null);
  readonly isLoading = computed(() => this.txLoading() || this.accLoading() || this.historyLoading());

  constructor() {}

  ensureMonthLoaded(key?: string) {
    const mk = key || this.currentMonthKey();
    // If computed signal was passed, ensure we read its value
    const monthKey = typeof mk === 'string' ? mk : this.currentMonthKey();
    // Cargar del backend y actualizar señales
    this.txLoading.set(true);
    this.txApi.list(monthKey).subscribe({
      next: (list) => {
        this.transactions.set((list || []).map(this.fromDto.bind(this)));
        const maxId = this.transactions().reduce((m, t) => Math.max(m, t.id), 0);
        this.nextId = Math.max(1, maxId + 1);
        this.listError.set(null);
      },
      error: () => {
        this.listError.set('No se pudieron cargar los movimientos.');
      },
      complete: () => this.txLoading.set(false),
    });
    // Cargar histórico completo (una sola vez) para arrastrar remanentes entre meses
    if (!this.allTransactions().length) {
      this.historyLoading.set(true);
      this.txApi.list().subscribe({
        next: (list) => {
          this.allTransactions.set((list || []).map(this.fromDto.bind(this)));
        },
        error: () => {},
        complete: () => this.historyLoading.set(false),
      });
    }
    // Cargar cuentas una vez y exponer saldos iniciales
    this.accLoading.set(true);
    this.accApi.list().subscribe({
      next: (list) => {
        const items = list || [];
        this.accounts.set(items);
        const map: Record<string, number> = {};
        items.forEach((a) => (map[a.name] = a.initialBalance ?? 0));
        this.initials.set(map);
        // preparar mapa nombre->id para operaciones
        this.accIdByName.clear();
        items.forEach((a) => this.accIdByName.set(a.name, a.id));
        this.listError.set(null);
      },
      error: () => {
        this.accounts.set([]);
        this.initials.set({});
        this.listError.set('No se pudieron cargar las cuentas.');
      },
      complete: () => this.accLoading.set(false),
    });

    // Cargar categorías para mapear nombre->id y evitar recrearlas al registrar movimientos
    this.catsApi.list().subscribe({
      next: (list) => {
        const items = list || [];
        this.catIdByName.clear();
        items.forEach((c) => this.catIdByName.set(c.name, c.id));
      },
      error: () => {
        // mantener mapa vacío; el alta intentará crear si realmente no existe
      },
    });
  }

  // Computed values
  readonly orderedTransactions = computed(() => {
    return [...this.transactions()].sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.id - a.id;
    });
  });

  // Detect transfer pairs between OPERATIVA <-> AHORRO to exclude from displayed income/expense
  readonly transferIds = computed(() => {
    const ids = new Set<number>();
    const typeByName = this.accountTypeByName();
    const keyOf = (d: string, amt: number, note?: string | null) => `${d}|${amt.toFixed(2)}`;
    const opExp = new Map<string, Transaction[]>();
    const opInc = new Map<string, Transaction[]>();
    const savExp = new Map<string, Transaction[]>();
    const savInc = new Map<string, Transaction[]>();
    for (const t of this.transactions()) {
      const accType = typeByName.get(t.account);
      const k = keyOf(t.date, t.amount, t.description);
      if (accType === 'OPERATIVA') {
        if (t.type === 'expense') { const arr = opExp.get(k) || []; arr.push(t); opExp.set(k, arr); }
        else { const arr = opInc.get(k) || []; arr.push(t); opInc.set(k, arr); }
      } else if (accType === 'AHORRO') {
        if (t.type === 'expense') { const arr = savExp.get(k) || []; arr.push(t); savExp.set(k, arr); }
        else { const arr = savInc.get(k) || []; arr.push(t); savInc.set(k, arr); }
      }
    }
    // depósito a ahorro: gasto en operativa + ingreso en ahorro
    for (const [k, arr] of opExp) {
      const m = savInc.get(k);
      if (m && m.length && arr.length) {
        arr.forEach((t) => ids.add(t.id));
        m.forEach((t) => ids.add(t.id));
      }
    }
    // retiro de ahorro: gasto en ahorro + ingreso en operativa
    for (const [k, arr] of savExp) {
      const m = opInc.get(k);
      if (m && m.length && arr.length) {
        arr.forEach((t) => ids.add(t.id));
        m.forEach((t) => ids.add(t.id));
      }
    }
    return ids;
  });

  readonly totalIncome = computed(() => {
    const exclude = this.transferIds();
    return this.transactions()
      .filter((t) => t.type === 'income' && !exclude.has(t.id))
      .reduce((sum, t) => sum + t.amount, 0);
  });

  readonly totalExpense = computed(() => {
    const exclude = this.transferIds();
    return this.transactions()
      .filter((t) => t.type === 'expense' && !exclude.has(t.id))
      .reduce((sum, t) => sum + t.amount, 0);
  });

  readonly initialTotal = computed(() => {
    const map = this.accountsSvc.initialBalances();
    return Object.values(map).reduce((a, b) => a + (Number.isFinite(b) ? (b as number) : 0), 0);
  });

  readonly balance = computed(() => this.initialTotal() + this.totalIncome() - this.totalExpense());

  private monthKeyFor(date: Date): string {
    // Align with backend semantics: monthKey labels the END month of the cutoff period.
    // Example with cutoff=26:
    //  - 2025-09-26 .. 2025-10-25  => monthKey = 2025-10
    //  - 2025-10-26 .. 2025-11-25  => monthKey = 2025-11
    const cutoff = Math.min(Math.max(this.settingsSvc.settings().monthCutoffDay || 1, 1), 28);
    let y = date.getFullYear();
    let m = date.getMonth(); // 0-based
    if (cutoff <= 1) {
      // Calendar month
      return `${y}-${String(m + 1).padStart(2, '0')}`;
    }
    if (date.getDate() >= cutoff) {
      // We're in the period that ends next month
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    // Otherwise, we're in the period that ends this current month
    return `${y}-${String(m + 1).padStart(2, '0')}`;
  }

  readonly currentMonthKey = computed(() => {
    return this.monthKeyFor(new Date());
  });

  readonly monthExpenseTotal = computed(() => {
    const key = this.currentMonthKey();
    let total = 0;
    for (const t of this.transactions()) {
      if (t.type !== 'expense') continue;
      const d = new Date(t.date + 'T00:00');
      const k = this.monthKeyFor(d);
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
    const typeByName = this.accountTypeByName();
    const TRANSFER = 'Transferencia interna';
    for (const t of this.transactions()) {
      // Alinear con cabecera: solo cuentas OPERATIVAS y excluir transferencias internas
      if (typeByName.get(t.account) !== 'OPERATIVA') continue;
      if (t.category === TRANSFER) continue;
      const d = new Date(t.date + 'T00:00');
      const key = this.monthKeyFor(d); // clave etiquetada por mes de CIERRE del periodo
      if (!groups.has(key)) {
        const [yStr, mStr] = key.split('-');
        const y = Number(yStr);
        const m = Number(mStr); // 1..12
        const labelDate = new Date(y, m - 1, 1);
        groups.set(key, { key, label: formatter.format(labelDate), income: 0, expense: 0 });
      }
      const summary = groups.get(key)!;
      if (t.type === 'income') summary.income += t.amount;
      else summary.expense += t.amount;
    }
    return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
  });

  readonly expenseByCategory = computed(() => {
    const categories = new Map<string, number>();
    const TRANSFER = 'Transferencia interna';
    for (const t of this.transactions()) {
      if (t.type === 'expense' && t.category !== TRANSFER) {
        categories.set(t.category, (categories.get(t.category) ?? 0) + t.amount);
      }
    }
    return [...categories.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  readonly expenseByAccount = computed(() => {
    const accounts = new Map<string, number>();
    const TRANSFER = 'Transferencia interna';
    for (const t of this.transactions()) {
      if (t.type === 'expense' && t.category !== TRANSFER) {
        const acc = t.account || 'General';
        accounts.set(acc, (accounts.get(acc) ?? 0) + t.amount);
      }
    }
    return [...accounts.entries()]
      .map(([account, amount]) => ({ account, amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  // Saldo de apertura por periodo (cierre acumulado de periodos anteriores + saldo configurado)
  private openingBalancesFor(monthKey: string): Record<string, number> {
    const base: Record<string, number> = { ...this.initials() };
    const before = (t: Transaction) => this.monthKeyFor(new Date(t.date + 'T00:00')).localeCompare(monthKey) < 0;
    for (const t of this.allTransactions()) {
      if (!before(t)) continue;
      const acc = t.account || 'General';
      base[acc] = Number(base[acc] ?? 0) + (t.type === 'income' ? t.amount : -t.amount);
    }
    return base;
  }

  readonly accountTotals = computed(() => {
    const map = new Map<
      string,
      { account: string; income: number; expense: number; balance: number; initial: number }
    >();
    const mk = this.currentMonthKey();
    const initials = this.openingBalancesFor(typeof mk === 'string' ? mk : this.currentMonthKey());
    const exclude = this.transferIds();
    // Seed all known accounts so those with solo saldo inicial también aparezcan
    Object.keys(initials).forEach((acc) => {
      map.set(acc, { account: acc, income: 0, expense: 0, balance: 0, initial: Number(initials[acc] ?? 0) });
    });

    const TRANSFER = 'Transferencia interna';
    // Aggregate movements
    const byAcc = new Map<string, { incAll: number; expAll: number }>();
    for (const t of this.transactions()) {
      const acc = t.account || 'General';
      if (!map.has(acc)) {
        map.set(acc, { account: acc, income: 0, expense: 0, balance: 0, initial: Number(initials[acc] ?? 0) });
      }
      const ref = map.get(acc)!;
      if (!exclude.has(t.id)) {
        if (t.type === 'income') ref.income += t.amount; else ref.expense += t.amount;
      }
      const o = byAcc.get(acc) || { incAll: 0, expAll: 0 };
      if (t.type === 'income') o.incAll += t.amount; else o.expAll += t.amount;
      byAcc.set(acc, o);
    }
    // Compute balance = initial + ingresos - gastos (incluye transferencias)
    for (const v of map.values()) {
      const o = byAcc.get(v.account) || { incAll: 0, expAll: 0 };
      v.balance = v.initial + o.incAll - o.expAll;
    }
    return [...map.values()].sort((a, b) => b.expense - a.expense || b.income - a.income);
  });

  // Split totals by account type using live account list
  readonly operatingAccountTotals = computed(() => {
    const typeByName = this.accountTypeByName();
    return this.accountTotals().filter((t) => typeByName.get(t.account) === 'OPERATIVA');
  });
  readonly savingsAccountTotals = computed(() => {
    const typeByName = this.accountTypeByName();
    return this.accountTotals().filter((t) => typeByName.get(t.account) === 'AHORRO');
  });

  // Header metrics derived without component-local state
  readonly operatingTotalIncome = computed(() =>
    this.operatingAccountTotals().reduce((s, a) => s + a.income, 0)
  );
  readonly operatingTotalExpense = computed(() =>
    this.operatingAccountTotals().reduce((s, a) => s + a.expense, 0)
  );
  readonly operatingBalanceTotal = computed(() =>
    this.operatingAccountTotals().reduce((s, a) => s + a.balance, 0)
  );
  readonly operatingSavingsRate = computed(() => {
    const inc = this.operatingTotalIncome();
    return inc ? this.operatingBalanceTotal() / inc : 0;
  });
  readonly totalSavingsBalance = computed(() =>
    this.savingsAccountTotals().reduce((s, a) => s + a.balance, 0)
  );

  // Periodo visible (inicio y fin) conforme al día de corte actual
  readonly periodStart = computed(() => {
    const key = this.currentMonthKey(); // yyyy-MM etiquetado según corte
    const cutoff = Math.min(Math.max(this.settingsSvc.settings().monthCutoffDay || 1, 1), 31);
    const [y, m] = key.split('-').map((n) => Number(n));
    if (cutoff <= 1) {
      return `${y}-${String(m).padStart(2, '0')}-01`;
    }
    // inicio: mes anterior en día de corte (ajustado al largo del mes)
    let py = y;
    let pm = m - 1;
    if (pm <= 0) { pm = 12; py -= 1; }
    const prevLen = new Date(py, pm, 0).getDate();
    const day = Math.min(cutoff, prevLen);
    return `${py}-${String(pm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });

  // Serie mensual de ahorro neto (depósitos - retiros) considerando SOLO cuentas de ahorro
  readonly monthlySavingsByKey = computed(() => {
    const map = new Map<string, number>();
    const typeByName = this.accountTypeByName();
    for (const t of this.transactions()) {
      if (typeByName.get(t.account) !== 'AHORRO') continue;
      const d = new Date(t.date + 'T00:00');
      const key = this.monthKeyFor(d);
      const prev = map.get(key) || 0;
      const delta = t.type === 'income' ? t.amount : -t.amount;
      map.set(key, prev + delta);
    }
    // Convert to plain object for template binding convenience
    const obj: Record<string, number> = {};
    for (const [k, v] of map.entries()) obj[k] = v;
    return obj;
  });
  readonly periodEnd = computed(() => {
    const key = this.currentMonthKey();
    const cutoff = Math.min(Math.max(this.settingsSvc.settings().monthCutoffDay || 1, 1), 31);
    const [y, m] = key.split('-').map((n) => Number(n));
    if (cutoff <= 1) {
      const endDay = new Date(y, m, 0).getDate();
      return `${y}-${String(m).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    }
    const currLen = new Date(y, m, 0).getDate();
    const day = Math.min(cutoff, currLen) - 1;
    const safeDay = day <= 0 ? 1 : day;
    return `${y}-${String(m).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
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
      return `Has superado tu presupuesto mensual por ${diff.toLocaleString(this.locale, {
        style: 'currency',
        currency: this.currencyCode(),
      })}. Revisa tus gastos o ajusta tu planificación.`;
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
    let accountId = this.accIdByName.get(t.account);
    const categoryName = (t.category ?? '').toString().trim() || 'Sin categoría';
    let categoryId = this.catIdByName.get(categoryName);

    const toIsoDate = (val: string | Date): string => {
      if (!val) return '';
      if (val instanceof Date) {
        // Keep date only; avoid timezone shift
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      // string like yyyy-MM-dd or ISO
      return (val as string).slice(0, 10);
    };

    const proceed = () =>
      this.txApi
        .create({
          type: t.type === 'income' ? 'INCOME' : 'EXPENSE',
          accountId: accountId as number,
          categoryId: categoryId as number,
          amount: t.amount,
          date: toIsoDate(t.date as any),
          description: t.description,
        })
        .subscribe({
          next: (dto) => {
            const created = this.fromDto(dto);
            this.transactions.update((curr) => [created, ...curr]);
            this.lastInfo.set('Movimiento agregado.');
            this.lastError.set(null);
          },
          error: () => {
            this.lastError.set('No se pudo guardar el movimiento.');
          },
        });

    // Create missing category/account on the fly if needed
    const ensureCategory = (): Promise<void> =>
      new Promise((resolve) => {
        if (categoryId) return resolve();
        this.catsApi.create(categoryName).subscribe({
          next: (c) => {
            this.catIdByName.set(c.name, c.id);
            categoryId = c.id;
            resolve();
          },
          error: () => {
            this.lastError.set('Categoría no encontrada.');
            resolve();
          },
        });
      });

    const ensureAccount = (): Promise<void> =>
      new Promise((resolve) => {
        if (accountId) return resolve();
        // Por defecto, creamos cuentas nuevas como OPERATIVA
        this.accApi.create({ name: t.account, type: 'OPERATIVA' }).subscribe({
          next: (a) => {
            this.accIdByName.set(a.name, a.id);
            accountId = a.id;
            resolve();
          },
          error: () => {
            this.lastError.set('Cuenta no encontrada.');
            resolve();
          },
        });
      });

    Promise.all([ensureCategory(), ensureAccount()]).then(() => {
      if (!accountId || !categoryId) {
        // Mensajes ya seteados por ensures
        return;
      }
      proceed();
    });
  }

  updateTransaction(id: number, t: Omit<Transaction, 'id'>) {
    let accountId = this.accIdByName.get(t.account);
    const categoryName = (t.category ?? '').toString().trim() || 'Sin categoría';
    let categoryId = this.catIdByName.get(categoryName);

    const toIsoDate = (val: string | Date): string => {
      if (!val) return '';
      if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      return (val as string).slice(0, 10);
    };

    const proceed = () =>
      this.txApi
        .update(id, {
          type: t.type === 'income' ? 'INCOME' : 'EXPENSE',
          accountId: accountId as number,
          categoryId: categoryId as number,
          amount: t.amount,
          date: toIsoDate(t.date as any),
          description: t.description,
        })
        .subscribe({
          next: (dto) => {
            const updated = this.fromDto(dto);
            this.transactions.update((curr) => curr.map((x) => (x.id === id ? updated : x)));
            this.lastInfo.set('Movimiento actualizado.');
            this.lastError.set(null);
          },
          error: () => this.lastError.set('No se pudo actualizar el movimiento.'),
        });

    const ensureCategory = (): Promise<void> =>
      new Promise((resolve) => {
        if (categoryId) return resolve();
        this.catsApi.create(categoryName).subscribe({
          next: (c) => {
            this.catIdByName.set(c.name, c.id);
            categoryId = c.id;
            resolve();
          },
          error: () => {
            this.lastError.set('Categoría no encontrada.');
            resolve();
          },
        });
      });

    const ensureAccount = (): Promise<void> =>
      new Promise((resolve) => {
        if (accountId) return resolve();
        this.accApi.create({ name: t.account, type: 'OPERATIVA' }).subscribe({
          next: (a) => {
            this.accIdByName.set(a.name, a.id);
            accountId = a.id;
            resolve();
          },
          error: () => {
            this.lastError.set('Cuenta no encontrada.');
            resolve();
          },
        });
      });

    Promise.all([ensureCategory(), ensureAccount()]).then(() => {
      if (!accountId || !categoryId) return;
      proceed();
    });
  }

  removeTransaction(id: number) {
    this.txApi.delete(id).subscribe({
      next: () => {
        this.transactions.update((curr) => curr.filter((t) => t.id !== id));
        this.lastInfo.set('Movimiento eliminado.');
        this.lastError.set(null);
      },
      error: () => this.lastError.set('No se pudo eliminar el movimiento.'),
    });
  }

  renameCategory(prev: string, next: string) {
    if (!prev || !next || prev === next) return;
    this.transactions.update((current) =>
      current.map((t) => (t.category === prev ? { ...t, category: next } : t))
    );
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
    this.transactions.update((current) =>
      current.map((t) => (t.account === prev ? { ...t, account: next } : t))
    );
    this.saveTransactions();
  }

  removeAccount(_name: string) {
    // Intentionally left blank: removing an account does not alter past transactions.
  }

  setCurrency(code: 'MXN' | 'USD' | 'EUR') {
    this.settingsSvc.setCurrency(code);
  }

  private saveTransactions() {
    /* no-op: persisted in API */
  }

  private loadTransactions(): Transaction[] {
    return [];
  }

  private loadCurrency(): 'MXN' | 'USD' | 'EUR' {
    return 'MXN';
  }

  private fromDto(dto: TransactionDTO): Transaction {
    // Map ids back to names using known maps; if missing, use string ids as fallback
    const accountName =
      dto.accountName ||
      [...this.accIdByName.entries()].find(([name, id]) => id === dto.accountId)?.[0] ||
      String(dto.accountId);
    const categoryName =
      dto.categoryName ||
      [...this.catIdByName.entries()].find(([name, id]) => id === dto.categoryId)?.[0] ||
      String(dto.categoryId);
    return {
      id: dto.id,
      type: dto.type === 'INCOME' ? 'income' : 'expense',
      category: categoryName,
      account: accountName,
      description: dto.description,
      amount: dto.amount,
      date: dto.date,
    };
  }
}
