import { CommonModule } from '@angular/common';
import { Component, Input, inject, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  amount: number;
  date: string; // ISO yyyy-MM-dd
}

@Component({
  selector: 'app-budget-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './budget-card.component.html',
  styleUrl: './budget-card.component.css',
})
export class BudgetCardComponent {
  private readonly budget = inject(BudgetService);
  private readonly fb = inject(FormBuilder);

  @Input() categories: string[] = [];
  @Input() transactions: Transaction[] = [];
  @Input() currencyCode!: string;

  // Reactive form for fixed expenses
  fixedForm: FormGroup = this.fb.group({
    name: this.fb.control('', { validators: [Validators.required, Validators.maxLength(40)] }),
    amount: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    category: this.fb.control<string>(''),
  });

  readonly fixedExpenses = this.budget.fixedExpenses;
  readonly categoryBudgets = this.budget.categoryBudgets;

  // Compute current month expenses by category
  readonly currentMonthKey = computed(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  readonly spentByCategoryThisMonth = computed<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    const key = this.currentMonthKey();
    for (const t of this.transactions) {
      if (t.type !== 'expense') continue;
      const d = new Date(t.date + 'T00:00');
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (k !== key) continue;
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    }
    return map;
  });

  addFixed() {
    if (this.fixedForm.invalid) { this.fixedForm.markAllAsTouched(); return; }
    const raw = this.fixedForm.getRawValue();
    const name = (raw.name ?? '').toString().trim();
    const amount = Number(raw.amount);
    const category = (raw.category ?? '').toString().trim() || undefined;
    if (!name || !Number.isFinite(amount) || amount < 0) { return; }
    this.budget.addFixed(name, amount, category);
    this.fixedForm.reset({ name: '', amount: null, category: '' });
  }

  updateCategoryBudget(cat: string, value: number) {
    if (!Number.isFinite(value) || value < 0) return;
    this.budget.setCategoryBudget(cat, value);
  }

  removeCategoryBudget(cat: string) { this.budget.removeCategoryBudget(cat); }
  removeFixed(id: number) { this.budget.removeFixed(id); }

  updateFixedCategory(id: number, category: string) {
    const value = (category ?? '').toString().trim() || undefined;
    this.budget.updateFixedItem(id, { category: value });
  }

  // Summary totals
  readonly totalBudget = computed(() => {
    const map = this.categoryBudgets();
    return Object.values(map).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  });

  readonly totalSpentThisMonth = computed(() => {
    const m = this.spentByCategoryThisMonth();
    return Object.values(m).reduce((a, b) => a + b, 0);
  });

  readonly percentSpent = computed(() => {
    const budget = this.totalBudget();
    const spent = this.totalSpentThisMonth();
    if (budget <= 0) return 0;
    return Math.min(100, Math.round((spent / budget) * 100));
  });

  getBudget(cat: string): number {
    const v = this.categoryBudgets()[cat];
    return Number.isFinite(v as number) ? (v as number) : 0;
  }

  getSpent(cat: string): number {
    const m = this.spentByCategoryThisMonth();
    const v = m[cat];
    return Number.isFinite(v as number) ? (v as number) : 0;
  }
}
