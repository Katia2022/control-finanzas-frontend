import { Component, inject, OnDestroy, effect, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { TransactionFormComponent } from '../../components/transaction-form/transaction-form.component';
import { TransactionsImportComponent } from '../../components/transactions-import/transactions-import.component';
import { TransactionsExportComponent } from '../../components/transactions-export/transactions-export.component';
import { TransactionsTableComponent } from '../../components/transactions-table/transactions-table.component';
import { TransactionsService, Transaction } from '../../services/transactions.service';
import { CategoriesService } from '../../services/categories.service';
import { AccountsStore } from '../../state/accounts.store';
import { BudgetService } from '../../services/budget.service';
import { combineLatest, debounceTime, startWith, Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PRIMENG_IMPORTS } from '../../shared/primeng';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ...PRIMENG_IMPORTS,
    TransactionFormComponent,
    TransactionsTableComponent,
    TransactionsImportComponent,
    TransactionsExportComponent,
  ],
  templateUrl: './transactions-page.component.html',
  styleUrls: ['./transactions-page.component.css'],
})
export class TransactionsPageComponent implements OnInit, OnDestroy {
  readonly transactionService = inject(TransactionsService);
  readonly categoriesSvc = inject(CategoriesService);
  readonly budgetSvc = inject(BudgetService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(MessageService);
  private readonly accStore = inject(AccountsStore);
  filterAccount = this.fb.control<string>('');
  private descSub?: Subscription;
  readonly errorMsg = this.transactionService.lastError;
  readonly infoMsg = this.transactionService.lastInfo;
  // React to async accounts load
  readonly accountsFx = effect(() => {
    const list = this.accStore.itemsSig?.() || [];
    this.operatingAccountNames = (list || [])
      .filter((a: any) => a.type === 'OPERATIVA')
      .map((a: any) => a.name);
    this.savingsAccountNames = (list || [])
      .filter((a: any) => a.type === 'AHORRO')
      .map((a: any) => a.name);
  });
  private editingId: number | null = null;
  operatingAccountNames: string[] = [];
  savingsAccountNames: string[] = [];
  // Dialog visibility
  readonly showRegister = signal(false);
  readonly showImport = signal(false);
  readonly showExport = signal(false);
  exportRows: Transaction[] = [];
  // UX option: close the register dialog after saving
  readonly closeAfterSave = signal(false);

  // Toast notifications from TransactionsService signals
  readonly toastFx = effect(() => {
    const err = this.errorMsg();
    const info = this.infoMsg();
    if (err) this.msg.add({ severity: 'error', summary: 'Movimientos', detail: err, life: 3500 });
    if (info)
      this.msg.add({ severity: 'success', summary: 'Movimientos', detail: info, life: 2200 });
  });

  readonly form = this.fb.group({
    type: this.fb.control<'income' | 'expense'>('income', { nonNullable: true }),
    date: this.fb.control(this.todayIso(), { validators: [Validators.required] }),
    category: this.fb.control('', {
      validators: [Validators.required, Validators.maxLength(40)],
      nonNullable: true,
    }),
    account: this.fb.control('', {
      validators: [Validators.required, Validators.maxLength(40)],
      nonNullable: true,
    }),
    description: this.fb.control('', { validators: [Validators.maxLength(120)] }),
    amount: this.fb.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const category = v.category.trim();
    const account = v.account.trim();
    if (!category) {
      this.form.get('category')?.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }
    if (!account) {
      this.form.get('account')?.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }
    const payload = {
      type: v.type!,
      category,
      account,
      description: v.description?.trim() || undefined,
      amount: Number(v.amount),
      date: v.date!,
    } as const;
    if (this.editingId != null) {
      this.transactionService.updateTransaction(this.editingId, payload);
      this.editingId = null;
    } else {
      this.transactionService.addTransaction(payload);
    }
    this.form.reset({
      type: v.type,
      date: this.todayIso(),
      category: '',
      account: '',
      description: '',
      amount: null,
    });
    // Optionally close the dialog if user enabled it
    if (this.closeAfterSave()) {
      try { this.showRegister.set(false); } catch {}
    }
  }

  async importRows(
    rows: {
      type: 'income' | 'expense';
      date: string;
      category: string;
      account: string;
      description?: string;
      amount: number;
    }[]
  ) {
    // Deduplicación contra lo ya guardado: clave por fecha|cuenta|tipo|monto|descripcion
    const norm = (s: unknown) => (s ?? '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
    const keyOf = (x: {
      date: string;
      account: string;
      type: 'income' | 'expense';
      amount: number;
      description?: string;
    }) =>
      `${x.date}|${(x.account ?? '').toString().trim()}|${x.type}|${x.amount.toFixed(2)}|${norm(
        x.description
      )}`;

    const existing = new Set(this.transactionService.transactions().map((t) => keyOf(t)));
    const toImport = rows.filter((r) => !existing.has(keyOf(r)));
    const skipped = rows.length - toImport.length;

    // Procesa en serie para no saturar el backend y aprovechar la lógica existente del servicio
    for (const r of toImport) {
      await new Promise<void>((resolve) => {
        this.transactionService.addTransaction(r);
        setTimeout(() => resolve(), 120);
      });
    }

    // Mensaje al usuario
    const msg =
      skipped > 0
        ? `Importación completada: ${toImport.length} nuevos, ${skipped} duplicados omitidos.`
        : `Importación completada: ${toImport.length} nuevos.`;
    try {
      this.transactionService.lastInfo.set(msg);
    } catch {}
    try { this.showImport.set(false); } catch {}
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  get filteredTransactions(): Transaction[] {
    const acc = (this.filterAccount.value ?? '').toString().trim();
    const savings = new Set(this.savingsAccountNames);
    const list = this.transactionService
      .orderedTransactions()
      .filter((t) => !savings.has(t.account));
    if (!acc) return list;
    return list.filter((t) => (t.account ?? '').toString() === acc);
  }

  get fixedNamesForSelectedCategory(): string[] {
    const cat = (this.form.get('category')?.value ?? '').toString().trim();
    if (!cat) return [];
    return this.budgetSvc
      .fixedExpenses()
      .filter((f) => (f.category ?? '') === cat)
      .map((f) => f.name);
  }

  constructor() {
    // Auto-complete amount when description matches a fixed expense of the selected category
    const descCtrl = this.form.get('description');
    const catCtrl = this.form.get('category');
    const amtCtrl = this.form.get('amount');
    if (descCtrl && catCtrl && amtCtrl) {
      this.descSub = combineLatest([
        catCtrl.valueChanges.pipe(startWith(catCtrl.value ?? '')),
        descCtrl.valueChanges.pipe(startWith(descCtrl.value ?? '')),
      ])
        .pipe(debounceTime(100))
        .subscribe(([cat, desc]) => {
          const category = (cat ?? '').toString().trim();
          const name = (desc ?? '').toString().trim();
          if (!category || !name) return;
          const match = this.budgetSvc
            .fixedExpenses()
            .find((f) => (f.category ?? '') === category && f.name === name);
          if (match) {
            const current = Number(amtCtrl.value);
            if (!Number.isFinite(current) || current !== match.amount) {
              amtCtrl.setValue(match.amount);
            }
          }
        });
    }

    // no-op here; we'll load lazily in ngOnInit
  }

  ngOnInit(): void {
    // Lazy-load datasets used in this screen
    this.transactionService.ensureMonthLoaded();
    this.categoriesSvc.ensureLoaded?.();
    this.budgetSvc.ensureLoaded?.();
    this.accStore.load();
    // Also hydrate immediately from any cached items
    const list = this.accStore.items || [];
    if (list && list.length) {
      this.operatingAccountNames = list.filter((a: any) => a.type === 'OPERATIVA').map((a: any) => a.name);
      this.savingsAccountNames = list.filter((a: any) => a.type === 'AHORRO').map((a: any) => a.name);
    }
  }

  onEdit(transactionService: Transaction) {
    this.editingId = transactionService.id;
    this.form.setValue({
      type: transactionService.type,
      date: transactionService.date,
      category: transactionService.category,
      account: transactionService.account,
      description: transactionService.description ?? '',
      amount: transactionService.amount,
    });
  }

  get isEditing(): boolean {
    return this.editingId != null;
  }

  cancelEdit() {
    this.editingId = null;
    this.form.reset({
      type: 'income',
      date: this.todayIso(),
      category: '',
      account: '',
      description: '',
      amount: null,
    });
  }

  ngOnDestroy(): void {
    try {
      this.descSub?.unsubscribe();
    } catch {}
  }

  prepareExport(rows: Transaction[]) {
    this.exportRows = rows || [];
    this.showExport.set(true);
  }
}
