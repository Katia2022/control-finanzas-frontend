import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal, effect } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AccountsApi } from '../../api/accounts.api';
// import { AccountsStore } from '../../state/accounts.store';
import { SavingsApi } from '../../api/savings.api';
import { TransactionsApi } from '../../api/transactions.api';
import { TransactionsService } from '../../services/transactions.service';
import { PRIMENG_IMPORTS } from '../../shared/primeng';
import { AccountSummaryComponent } from '../../components/account-summary/account-summary.component';
import { SettingsService } from '../../services/settings.service';
import { MessageService } from 'primeng/api';

type MoveView = {
  id: number;
  date: string;
  amount: number;
  status: 'DONE';
  kind: 'deposit' | 'withdraw';
  note?: string;
};

@Component({
  selector: 'app-savings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ...PRIMENG_IMPORTS, AccountSummaryComponent],
  templateUrl: './savings-page.component.html',
  styleUrl: './savings-page.component.css',
})
export class SavingsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly savingsApi = inject(SavingsApi);
  private readonly txApi = inject(TransactionsApi);
  private readonly accountsApi = inject(AccountsApi);
  // private readonly accountsStore = inject(AccountsStore);
  readonly transactionService = inject(TransactionsService);
  private readonly messageService = inject(MessageService);
  private readonly settingsSvc = inject(SettingsService);
  // Debug helper
  private readonly debug = true;
  private log(...args: any[]) {
    try {
      if (this.debug) console.debug('[Savings]', ...args);
    } catch {}
  }
  private lastMonthKeyFetched: string | null = null;
  private accountsLoaded = false;
  // React to monthKey changes (debounced to avoid double fetch when settings arrive)
  private refreshTimer: any = null;
  private pendingMonthKey: string | null = null;
  readonly monthChangedFx = effect(() => {
    const mk = this.monthKey();
    this.log('monthKey changed', mk);
    this.scheduleRefresh(mk);
  });

  readonly monthKey = computed(() => this.transactionService.currentMonthKey());
  // Mostrar mes calendario (sin corte) para evitar confusión en el encabezado
  readonly displayMonthKey = computed(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Periodo exacto según corte de mes (start inclusive, end inclusive)
  readonly periodStart = computed(() => {
    const key = this.monthKey(); // yyyy-MM etiquetado según corte
    const cutoff = Math.min(Math.max(this.settingsSvc.settings().monthCutoffDay || 1, 1), 31);
    const [y, m] = key.split('-').map((n) => Number(n));
    if (cutoff <= 1) {
      return `${y}-${String(m).padStart(2, '0')}-01`;
    }
    // start is prev month at cutoff day (clamped to month length)
    let py = y;
    let pm = m - 1;
    if (pm <= 0) { pm = 12; py -= 1; }
    const prevLen = new Date(py, pm, 0).getDate(); // days in prev month
    const day = Math.min(cutoff, prevLen);
    return `${py}-${String(pm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });
  readonly periodEnd = computed(() => {
    const key = this.monthKey();
    const cutoff = Math.min(Math.max(this.settingsSvc.settings().monthCutoffDay || 1, 1), 31);
    const [y, m] = key.split('-').map((n) => Number(n));
    if (cutoff <= 1) {
      const endDay = new Date(y, m, 0).getDate();
      return `${y}-${String(m).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    }
    // end is current month day before cutoff
    const currLen = new Date(y, m, 0).getDate();
    const day = Math.min(cutoff, currLen) - 1;
    const safeDay = day <= 0 ? 1 : day;
    return `${y}-${String(m).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
  });
  readonly incomeThisMonth = signal(0);
  // Ahorro ejecutado en el mes (neto): depósitos a cuentas de ahorro menos retiros desde cuentas de ahorro
  readonly monthlySavings = computed(() => this.monthlyDeposited() - this.monthlyWithdrawn());
  // Suma de saldos de cuentas de ahorro visibles en el resumen
  readonly totalSavingsBalance = computed(() =>
    this.savingsTotals().reduce((s, t) => s + (t.balance || 0), 0)
  );
  // Balance total en cuentas operativas como referencia para transferir
  readonly operatingBalance = computed(() => {
    const operatingNames = new Set(this.operatingAccounts().map((a) => a.name));
    return this.transactionService
      .accountTotals()
      .filter((t) => operatingNames.has(t.account))
      .reduce((s, t) => s + (t.balance || 0), 0);
  });
  // Totales del mes por tipo (derivados de transacciones)
  readonly monthlyDeposited = computed(() => {
    const savingsIds = new Set(this.savingsAccounts().map((a) => a.id));
    const savingsNames = new Set(this.savingsAccounts().map((a) => a.name));
    let sum = 0;
    for (const t of this.allTransactions()) {
      const accId = Number((t as any).accountId ?? NaN);
      const byId = Number.isFinite(accId) && savingsIds.has(accId);
      const name = (t as any).accountName || this.accountsById()[accId];
      const byName = !!name && savingsNames.has(name);
      if (!(byId || byName)) continue;
      if (t.type === 'INCOME') sum += t.amount || 0;
    }
    return sum;
  });
  readonly monthlyWithdrawn = computed(() => {
    const savingsIds = new Set(this.savingsAccounts().map((a) => a.id));
    const savingsNames = new Set(this.savingsAccounts().map((a) => a.name));
    let sum = 0;
    for (const t of this.allTransactions()) {
      const accId = Number((t as any).accountId ?? NaN);
      const byId = Number.isFinite(accId) && savingsIds.has(accId);
      const name = (t as any).accountName || this.accountsById()[accId];
      const byName = !!name && savingsNames.has(name);
      if (!(byId || byName)) continue;
      if (t.type === 'EXPENSE') sum += t.amount || 0;
    }
    return sum;
  });

  readonly accounts = signal<string[]>([]);
  readonly accountsById = signal<Record<number, string>>({});
  readonly initialById = signal<Record<number, number>>({});
  readonly operatingAccounts = signal<{ id: number; name: string }[]>([]);
  readonly savingsAccounts = signal<{ id: number; name: string }[]>([]);
  readonly savingsTotals = computed(() => {
    const savingsNames = new Set(this.savingsAccounts().map((a) => a.name));
    const initialsById = this.initialById();
    const namesById = this.accountsById();
    const initialByName: Record<string, number> = {};
    for (const [idStr, name] of Object.entries(namesById)) {
      const id = Number(idStr);
      initialByName[name] = Number(initialsById[id] ?? 0);
    }
    const totalsMap = new Map<string, { account: string; income: number; expense: number; balance: number; initial: number }>();
    for (const t of this.monthTransactions()) {
      const name = t.accountName || namesById[t.accountId] || '';
      if (!name) continue;
      if (!totalsMap.has(name)) {
        totalsMap.set(name, { account: name, income: 0, expense: 0, balance: 0, initial: initialByName[name] ?? 0 });
      }
      const agg = totalsMap.get(name)!;
      if (t.type === 'INCOME') agg.income += t.amount || 0;
      else agg.expense += t.amount || 0;
      agg.balance = (initialByName[name] ?? 0) + agg.income - agg.expense;
    }
    // Generar lista y filtrar solo cuentas de ahorro; si alguna de ahorro no tuvo movimientos, incluir con saldo inicial
    const result: { account: string; income: number; expense: number; balance: number; initial: number }[] = [];
    for (const name of savingsNames) {
      const item = totalsMap.get(name);
      if (item) result.push(item);
      else result.push({ account: name, income: 0, expense: 0, balance: initialByName[name] ?? 0, initial: initialByName[name] ?? 0 });
    }
    return result;
  });

  // Histórico derivado desde transacciones (no se usan savings_moves)
  readonly allTransactions = signal<import('../../api/transactions.api').TransactionDTO[]>([]);
  
  // Derivar puntuales (depósitos y retiros) a partir de pares gasto/ingreso entre operativas y ahorro
  readonly adHocDerived = computed<MoveView[]>(() => {
    const transactions = this.allTransactions();
    if (!transactions || !transactions.length) return [];
    const operativas = new Set(this.operatingAccounts().map((a) => a.name));
    const ahorro = new Set(this.savingsAccounts().map((a) => a.name));
    const norm = (s?: string | null) => (s ?? '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
    const keyOf = (d: string, amt: number, note?: string | null) => `${d}|${amt.toFixed(2)}|${norm(note)}`;

    // Maps por dirección
    const opExp = new Map<string, import('../../api/transactions.api').TransactionDTO[]>(); // gasto en operativa
    const savInc = new Map<string, import('../../api/transactions.api').TransactionDTO[]>(); // ingreso en ahorro
    const savExp = new Map<string, import('../../api/transactions.api').TransactionDTO[]>(); // gasto en ahorro
    const opInc = new Map<string, import('../../api/transactions.api').TransactionDTO[]>(); // ingreso en operativa

    for (const t of transactions) {
      const name = t.accountName || this.accountsById()[t.accountId];
      if (!name) continue;
      const k = keyOf(t.date, t.amount || 0, t.description);
      if (t.type === 'EXPENSE') {
        if (operativas.has(name)) {
          const arr = opExp.get(k) || []; arr.push(t); opExp.set(k, arr);
        }
        if (ahorro.has(name)) {
          const arr = savExp.get(k) || []; arr.push(t); savExp.set(k, arr);
        }
      } else if (t.type === 'INCOME') {
        if (ahorro.has(name)) {
          const arr = savInc.get(k) || []; arr.push(t); savInc.set(k, arr);
        }
        if (operativas.has(name)) {
          const arr = opInc.get(k) || []; arr.push(t); opInc.set(k, arr);
        }
      }
    }

    const result: MoveView[] = [];
    let generatedId = -1;

    // Depósitos: gasto en operativa + ingreso en ahorro
    for (const [k] of opExp.entries()) {
      const match = savInc.get(k);
      if (!match || match.length === 0) continue;
      const [date, amountStr] = k.split('|');
      const amount = Number(amountStr);
      result.push({ id: generatedId--, date, amount, status: 'DONE', kind: 'deposit', note: 'Puntual' });
    }
    // Retiros: gasto en ahorro + ingreso en operativa
    for (const [k] of savExp.entries()) {
      const match = opInc.get(k);
      if (!match || match.length === 0) continue;
      const [date, amountStr] = k.split('|');
      const amount = Number(amountStr);
      result.push({ id: generatedId--, date, amount, status: 'DONE', kind: 'withdraw', note: 'Puntual' });
    }

    return result.sort((a, b) => b.date.localeCompare(a.date));
  });

  readonly allMoves = computed<MoveView[]>(() => this.adHocDerived());

  // P-Table applies its own filters; keep list sorted by date desc
  readonly filteredMoves = computed(() =>
    [...(this.allMoves() || [])].sort((a, b) => b.date.localeCompare(a.date))
  );

  readonly operatingOptions = computed(() => {
    const opts = this.operatingAccounts().map((a) => ({
      label: `${a.name} (Operativa)`,
      value: a.id,
    }));
    return [{ label: '—', value: null as number | null }, ...opts];
  });
  readonly savingsOptions = computed(() => {
    const opts = this.savingsAccounts().map((a) => ({ label: `${a.name} (Ahorro)`, value: a.id }));
    return [{ label: '—', value: null as number | null }, ...opts];
  });
  accountName(id?: number | null): string {
    return (id != null ? this.accountsById()[id] : undefined) || '—';
  }

  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly infoMsg = signal<string | null>(null);
  readonly showConfirm = signal(false);
  readonly confirmText = signal('');

  readonly toastFx = effect(() => {
    const err = this.errorMsg();
    const info = this.infoMsg();
    if (err) this.messageService.add({ severity: 'error', summary: 'Ahorro', detail: err, life: 3500 });
    if (info) this.messageService.add({ severity: 'success', summary: 'Ahorro', detail: info, life: 2200 });
  });

  // Ad-hoc transfer form (deposit or withdraw)
  readonly adHocForm = this.fb.group({
    kind: this.fb.control<'deposit' | 'withdraw'>('deposit'),
    sourceAccountId: this.fb.control<number | null>(null),
    targetAccountId: this.fb.control<number | null>(null),
    date: this.fb.control<string>(this.todayIso()),
    amount: this.fb.control<number | null>(null, { validators: [Validators.min(0.01)] }),
    note: this.fb.control<string>(''),
  });

  // UI: show/hide ad-hoc form dialog
  readonly showAdHocForm = signal(false);

  // Cache monthly transactions to compute balances by account
  readonly monthTransactions = signal<import('../../api/transactions.api').TransactionDTO[]>([]);

  ngOnInit(): void {
    if (!this.accountsLoaded) {
      this.accountsApi.list().subscribe({
        next: (list) => {
          this.hydrateAccountsFromApi(list as any[]);
          this.accountsLoaded = true;
        },
        error: () => {},
      });
    }
    this.log('ngOnInit done. monthKey=', this.monthKey());
  }

  private hydrateAccountsFromApi(list: any[]) {
    const arr = (list as any[]) || [];
    this.accounts.set(arr.map((a: any) => a.name));
    const map: Record<number, string> = {};
    const init: Record<number, number> = {};
    arr.forEach((a: any) => {
      if (a && typeof a.id === 'number') {
        map[a.id] = a.name;
        init[a.id] = Number(a.initialBalance || 0);
      }
    });
    this.accountsById.set(map);
    this.initialById.set(init);
    this.operatingAccounts.set(
      arr.filter((a: any) => a.type === 'OPERATIVA').map((a: any) => ({ id: a.id, name: a.name }))
    );
    this.savingsAccounts.set(
      arr.filter((a: any) => a.type === 'AHORRO').map((a: any) => ({ id: a.id, name: a.name }))
    );
    this.log('Accounts loaded:', { total: arr.length });
  }

  private hydrateMonthFromTxService(source?: import('../../api/transactions.api').TransactionDTO[]) {
    const transactions = (source && Array.isArray(source)
      ? source
      : (this.transactionService.transactions()?.map?.((t: any) => t) || [])) as any[];
    const arr = transactions
      .map((t) => {
        const type = (t.type === 'INCOME' || t.type === 'EXPENSE')
          ? t.type
          : (t.type === 'income' ? 'INCOME' : 'EXPENSE');
        const accountName = (t.accountName ?? t.account) as string | undefined;
        const categoryName = (t.categoryName ?? t.category) as string | undefined;
        const accountId = Number((t.accountId ?? 0) as any) || 0;
        const categoryId = Number((t.categoryId ?? 0) as any) || 0;
        return {
          id: t.id as number,
          type: type as any,
          accountId,
          categoryId,
          accountName,
          categoryName,
          amount: Number((t.amount as any) ?? 0),
          date: String(t.date).slice(0, 10),
          description: t.description as string | undefined,
        };
      });
    this.monthTransactions.set(arr as any);
    const income = arr.filter((t) => t.type === 'INCOME').reduce((a, b) => a + (b.amount || 0), 0);
    this.incomeThisMonth.set(income);
    this.log('hydrateMonthFromTxService:', { txCount: transactions.length, monthTxCount: arr.length, incomeThisMonth: income });
  }

  private refreshAll() {
    const monthKeyStr = this.monthKey();
    if (this.lastMonthKeyFetched === monthKeyStr) {
      this.log('refreshAll skipped (already fetched)', { monthKeyStr });
      return;
    }
    this.lastMonthKeyFetched = monthKeyStr;
    this.log('refreshAll start', { monthKeyStr });
    this.loading.set(true);
    this.errorMsg.set(null);
    this.txApi.list(monthKeyStr).subscribe({
      next: (txList) => {
        this.allTransactions.set(txList || []);
        this.hydrateMonthFromTxService(txList || []);
        this.log('transactions loaded', { count: (txList || []).length });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
    // Ya no se consumen savings_moves del backend; histórico se deriva de transacciones
  }

  private scheduleRefresh(monthKeyStr: string) {
    this.pendingMonthKey = monthKeyStr;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = setTimeout(() => {
      // Only refresh if monthKey is still the pending one and different from last fetched
      if (this.pendingMonthKey && this.pendingMonthKey !== this.lastMonthKeyFetched) {
        this.refreshAll();
      } else {
        this.log('refresh coalesced', { monthKeyStr: this.pendingMonthKey });
      }
      this.refreshTimer = null;
    }, 150);
  }

  // Removed remanente calculation UI to simplify the form

  private balanceForAccount(accountName: string): number {
    const initial =
      Object.entries(this.initialById()).find(
        ([id, _]) => this.accountsById()[Number(id)] === accountName
      )?.[1] ?? 0;
    const monthTx = this.monthTransactions();
    let income = 0,
      expense = 0;
    for (const t of monthTx) {
      const name = t.accountName || this.accountsById()[t.accountId] || '';
      if (name === accountName) {
        if (t.type === 'INCOME') income += t.amount || 0;
        else expense += t.amount || 0;
      }
    }
    return Number(initial) + income - expense;
  }

  openConfirmAdHoc() {
    const formValues = this.adHocForm.getRawValue();
    if (!formValues.sourceAccountId || !formValues.targetAccountId || !(Number(formValues.amount) > 0)) {
      this.errorMsg.set('Selecciona cuentas válidas y un monto mayor a cero.');
      return;
    }
    const sourceAccountName = this.accountsById()[formValues.sourceAccountId!];
    const targetAccountName = this.accountsById()[formValues.targetAccountId!];
    const actionVerb = formValues.kind === 'withdraw' ? 'Retirar' : 'Transferir';
    this.confirmText.set(
      `${actionVerb} ${Number(formValues.amount).toFixed(2)} de ${sourceAccountName} a ${targetAccountName} el ${formValues.date}?`
    );
    this.showConfirm.set(true);
  }

  adHocTransfer() {
    const formValues = this.adHocForm.getRawValue();
    const toIsoDate = (v: any) => {
      if (!v) return this.todayIso();
      if (v instanceof Date) {
        const y = v.getFullYear();
        const m = String(v.getMonth() + 1).padStart(2, '0');
        const d = String(v.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      return v.toString().slice(0, 10);
    };
    if (!formValues.sourceAccountId || !formValues.targetAccountId || !(Number(formValues.amount) > 0)) {
      this.errorMsg.set('Selecciona cuentas válidas y un monto mayor a cero.');
      return;
    }
    this.loading.set(true);
    this.log('adHocTransfer request', {
      sourceAccountId: formValues.sourceAccountId,
      targetAccountId: formValues.targetAccountId,
      amount: Number(formValues.amount),
      date: toIsoDate(formValues.date),
    });
    this.savingsApi.adHoc({
      sourceAccountId: formValues.sourceAccountId!,
      targetAccountId: formValues.targetAccountId!,
      amount: Number(formValues.amount),
      date: toIsoDate(formValues.date),
      note: (formValues.note || '').toString().trim() || undefined,
    }).subscribe({
      next: (res) => {
        this.log('adHocTransfer success', res);
        this.infoMsg.set(
          `Movimiento ejecutado (gasto #${res.expenseTransactionId}, ingreso #${res.incomeTransactionId}).`
        );
        this.showConfirm.set(false);
        this.refreshAll();
      },
      error: (err) => {
        this.loading.set(false);
        this.log('adHocTransfer error', err);
        this.errorMsg.set(err?.error?.title || 'No se pudo ejecutar el movimiento.');
      },
    });
  }

  setMoveKind(kind: 'deposit' | 'withdraw') {
    try {
      this.adHocForm.patchValue({ kind });
    } catch {}
    try {
      this.showAdHocForm.set(true);
    } catch {}
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
