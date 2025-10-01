import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TransactionFormComponent } from '../../components/transaction-form/transaction-form.component';
import { TransactionsTableComponent } from '../../components/transactions-table/transactions-table.component';
import { TransactionsService, Transaction } from '../../services/transactions.service';
import { CategoriesService } from '../../services/categories.service';
import { AccountsService } from '../../services/accounts.service';
import { BudgetService } from '../../services/budget.service';
import { combineLatest, debounceTime, startWith, Subscription } from 'rxjs';

@Component({
  selector: 'app-movimientos-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TransactionFormComponent, TransactionsTableComponent],
  templateUrl: './movimientos-page.component.html',
  styleUrl: './movimientos-page.component.css'
})
export class MovimientosPageComponent implements OnDestroy {
  readonly tx = inject(TransactionsService);
  readonly categoriesSvc = inject(CategoriesService);
  readonly accountsSvc = inject(AccountsService);
  readonly budgetSvc = inject(BudgetService);
  private readonly fb = inject(FormBuilder);
  filterAccount = this.fb.control<string>('');
  private descSub?: Subscription;

  readonly form = this.fb.group({
    type: this.fb.control<'income' | 'expense'>('income', { nonNullable: true }),
    date: this.fb.control(this.todayIso(), { validators: [Validators.required] }),
    category: this.fb.control('', { validators: [Validators.required, Validators.maxLength(40)], nonNullable: true }),
    account: this.fb.control('', { validators: [Validators.required, Validators.maxLength(40)], nonNullable: true }),
    description: this.fb.control('', { validators: [Validators.maxLength(120)] }),
    amount: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0.01)] }),
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
    this.tx.addTransaction({
      type: v.type!,
      category,
      account,
      description: v.description?.trim() || undefined,
      amount: Number(v.amount),
      date: v.date!,
    });
    this.form.reset({ type: v.type, date: this.todayIso(), category: '', account: '', description: '', amount: null });
  }

  private todayIso(): string { return new Date().toISOString().slice(0, 10); }

  get filteredTransactions(): Transaction[] {
    const acc = (this.filterAccount.value ?? '').toString().trim();
    const list = this.tx.orderedTransactions();
    if (!acc) return list;
    return list.filter(t => (t.account ?? '').toString() === acc);
  }

  get fixedNamesForSelectedCategory(): string[] {
    const cat = (this.form.get('category')?.value ?? '').toString().trim();
    if (!cat) return [];
    return this.budgetSvc.fixedExpenses()
      .filter(f => (f.category ?? '') === cat)
      .map(f => f.name);
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
          const match = this.budgetSvc.fixedExpenses()
            .find(f => (f.category ?? '') === category && f.name === name);
          if (match) {
            const current = Number(amtCtrl.value);
            if (!Number.isFinite(current) || current !== match.amount) {
              amtCtrl.setValue(match.amount);
            }
          }
        });
    }
  }

  ngOnDestroy(): void {
    try { this.descSub?.unsubscribe(); } catch {}
  }
}
