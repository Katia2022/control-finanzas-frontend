import { CommonModule } from '@angular/common';
import { Component, Input, inject, computed, effect, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { PRIMENG_IMPORTS } from '../../shared/primeng';
import { BudgetService } from '../../services/budget.service';
import { MessageService } from 'primeng/api';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ...PRIMENG_IMPORTS],
  templateUrl: './budget-card.component.html',
  styleUrl: './budget-card.component.css',
})
export class BudgetCardComponent {
  private readonly budget = inject(BudgetService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(MessageService);

  @Input() categories: string[] = [];
  @Input() currencyCode!: string;
  private readonly planningCapSig = signal<number>(0);
  @Input() set planningCap(value: number | undefined) {
    this.planningCapSig.set(Number(value ?? 0));
  }
  // Expose a computed for template binding
  readonly planningCapValue = computed(() => this.planningCapSig());

  // Reactive inputs
  private readonly transactionsSig = signal<Transaction[]>([]);
  @Input() set transactions(value: Transaction[] | undefined) {
    this.transactionsSig.set(value ?? []);
  }

  private readonly monthKeySig = signal<string>('');
  @Input() set monthKey(value: string | undefined) { this.monthKeySig.set(value?.trim() || ''); }

  private readonly periodStartSig = signal<string | null>(null);
  @Input() set periodStart(value: string | undefined) { this.periodStartSig.set((value && value.trim()) || null); }

  private readonly periodEndSig = signal<string | null>(null);
  @Input() set periodEnd(value: string | undefined) { this.periodEndSig.set((value && value.trim()) || null); }

  // Reactive form for fixed expenses
  fixedForm: FormGroup = this.fb.group({
    name: this.fb.control('', { validators: [Validators.required, Validators.maxLength(40)] }),
    amount: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    category: this.fb.control<string>(''),
  });

  readonly fixedExpenses = this.budget.fixedExpenses;
  readonly categoryBudgets = this.budget.categoryBudgets;
  readonly errorMsg = this.budget.lastError;
  readonly infoMsg = this.budget.lastInfo;

  // Inline edit state for fixed expenses
  editingId: number | null = null;
  editName = '';
  editAmount: number | null = null;

  // Inline edit state for category budgets table
  editingCategory: string | null = null;
  tempBudget: number | null = null;

  // Toast notifications for Budget actions
  readonly toastFx = effect(() => {
    const err = this.errorMsg();
    const info = this.infoMsg();
    if (err) this.msg.add({ severity: 'error', summary: 'Presupuesto', detail: err, life: 3200 });
    if (info) this.msg.add({ severity: 'success', summary: 'Presupuesto', detail: info, life: 2000 });
  });

  private formatCurrency(v: number) {
    try {
      const code = this.currencyCode || 'EUR';
      return new Intl.NumberFormat('es-ES', { style: 'currency', currency: code, minimumFractionDigits: 2 }).format(v || 0);
    } catch { return (v ?? 0).toFixed(2); }
  }

  // Debug: log key values whenever inputs or totals change
  readonly debugFx = effect(() => {
    // Basic inputs
    const mk = this.currentMonthKey();
    const ps = this.periodStartSig();
    const pe = this.periodEndSig();
    const cap = this.planningCapSig();
    // Totals
    const totalBudget = this.totalBudget();
    const totalFixed = this.totalFixedThisMonth();
    const totalSpent = this.totalSpentThisMonth();
    const remaining = totalBudget - totalSpent;
    const remainingToPlan = this.remainingToPlan();
    // Per-category snapshot (top 5)
    const catSpent = this.spentByCategoryThisMonth();
    const top = Object.entries(catSpent)
      .sort((a,b) => b[1]-a[1])
      .slice(0,5)
      .reduce((o,[k,v]) => { (o as any)[k]=v; return o; }, {} as Record<string,number>);
    // Emit (en español y formateado)
    // eslint-disable-next-line no-console
    console.groupCollapsed('%c[Presupuesto] Resumen del periodo','color:#2563eb;font-weight:600');
    // eslint-disable-next-line no-console
    console.log('• Clave de mes:', mk);
    // eslint-disable-next-line no-console
    console.log('• Periodo de corte:', ps || '—', '→', pe || '—');
    // eslint-disable-next-line no-console
    console.groupCollapsed('• Totales');
    // eslint-disable-next-line no-console
    console.log('  - Presupuesto total:', this.formatCurrency(totalBudget));
    // eslint-disable-next-line no-console
    console.log('  - Gastos fijos:', this.formatCurrency(totalFixed));
    // eslint-disable-next-line no-console
    console.log('  - Gastado (real):', this.formatCurrency(totalSpent));
    // eslint-disable-next-line no-console
    console.log('  - Restante (Presupuesto − Gastado):', this.formatCurrency(remaining));
    // eslint-disable-next-line no-console
    console.log('  - Tope planificable:', this.formatCurrency(cap));
    // eslint-disable-next-line no-console
    console.log('  - Por planificar (Tope − Presupuesto):', this.formatCurrency(remainingToPlan));
    // eslint-disable-next-line no-console
    console.groupEnd();
    // eslint-disable-next-line no-console
    console.groupCollapsed('• Top 5 categorías por gasto');
    Object.entries(top).forEach(([cat, val]) => {
      // eslint-disable-next-line no-console
      console.log(`  · ${cat}:`, this.formatCurrency(val as number));
    });
    // eslint-disable-next-line no-console
    console.groupEnd();
    // eslint-disable-next-line no-console
    console.groupEnd();
  });

  // Compute current month expenses by category
  readonly currentMonthKey = computed(() => {
    const mk = this.monthKeySig();
    if (mk) return mk;
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  readonly spentByCategoryThisMonth = computed<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    const key = this.currentMonthKey();
    const ps = this.periodStartSig();
    const pe = this.periodEndSig();
    const start = ps ? new Date(ps + 'T00:00') : null;
    const end = pe ? new Date(pe + 'T23:59:59') : null;
    for (const t of this.transactionsSig()) {
      if (t.type !== 'expense') continue;
      if ((t.category || '').trim().toLowerCase() === 'ahorro') continue;
      const d = new Date(t.date + 'T00:00');
      if (start && end) {
        if (d < start || d > end) continue;
      } else {
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (k !== key) continue;
      }
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    }
    return map;
  });

  // Fixed expenses aggregated by category (used to reserve from budgets)
  readonly fixedByCategory = computed<Record<string, number>>(() => {
    const acc: Record<string, number> = {};
    for (const fx of this.fixedExpenses()) {
      const cat = fx.category || '';
      if ((cat || '').trim().toLowerCase() === 'ahorro') continue;
      if (!cat) continue; // skip uncategorized in reservation
      acc[cat] = (acc[cat] ?? 0) + (Number.isFinite(fx.amount) ? fx.amount : 0);
    }
    return acc;
  });

  readonly totalFixedThisMonth = computed(() => {
    const m = this.fixedByCategory();
    return Object.values(m).reduce((a, b) => a + b, 0);
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
    // Enforce cap across all categories: otherSum + value <= planningCap
    const cap = Number(this.planningCapSig());
    if (cap > 0) {
      const currentTotal = this.totalBudget();
      const currentThis = this.getBudget(cat);
      const otherSum = currentTotal - currentThis;
      const maxForThis = Math.max(0, cap - otherSum);
      if (value > maxForThis) {
        value = maxForThis;
        this.msg.add({ severity: 'warn', summary: 'Presupuesto', detail: 'Límite de planificación alcanzado.', life: 2200 });
      }
    }
    this.budget.setCategoryBudget(cat, value);
  }

  removeCategoryBudget(cat: string) { this.budget.removeCategoryBudget(cat); }
  removeFixed(id: number) { this.budget.removeFixed(id); }

  startEdit(fx: { id: number; name: string; amount: number }) {
    this.editingId = fx.id;
    this.editName = fx.name;
    this.editAmount = fx.amount;
  }

  cancelEdit() {
    this.editingId = null;
    this.editName = '';
    this.editAmount = null;
  }

  saveEdit(id: number) {
    const name = (this.editName || '').toString().trim();
    const amount = Number(this.editAmount ?? NaN);
    if (!name || !Number.isFinite(amount) || amount < 0) return;
    this.budget.updateFixedItem(id, { name, amount });
    this.cancelEdit();
  }

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
    // Progress against total budget (regardless fixed/variable)
    const budget = this.totalBudget();
    const spent = this.totalSpentThisMonth();
    if (budget <= 0) return spent > 0 ? 100 : 0;
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

  getFixed(cat: string): number {
    const m = this.fixedByCategory();
    const v = m[cat];
    return Number.isFinite(v as number) ? (v as number) : 0;
  }

  getVariableBudget(cat: string): number {
    return Math.max(0, this.getBudget(cat) - this.getFixed(cat));
  }

  getRemainingVariable(cat: string): number {
    return this.getVariableBudget(cat) - this.getSpent(cat);
  }

  getRemainingTotal(cat: string): number {
    return this.getBudget(cat) - this.getSpent(cat);
  }

  // Restantes en resumen
  readonly remainingPlanned = computed(() => this.totalBudget() - this.totalSpentThisMonth());
  readonly remainingReal = computed(() => this.planningCapSig() - this.totalSpentThisMonth());

  // Totals for variable budgeting
  readonly availableVariableTotal = computed(() => Math.max(0, this.totalBudget() - this.totalFixedThisMonth()));

  readonly remainingVariableTotal = computed(() => this.availableVariableTotal() - this.totalSpentThisMonth());

  // Planning helper: how much is left to plan globally
  readonly remainingToPlan = computed(() => {
    const cap = Number(this.planningCapSig());
    return cap > 0 ? cap - this.totalBudget() : 0;
  });

  get categoryOptions() {
    return (this.categories || []).map((c) => ({ label: c, value: c }));
  }

  get categoryOptionsWithNone() {
    return [{ label: '(sin categoría)', value: '' }, ...this.categoryOptions];
  }

  // Category budgets editing helpers
  startEditCategory(cat: string) {
    this.editingCategory = cat;
    this.tempBudget = this.getBudget(cat);
  }

  cancelEditCategory() {
    this.editingCategory = null;
    this.tempBudget = null;
  }

  saveEditCategory(cat: string) {
    const value = Number(this.tempBudget ?? NaN);
    if (!Number.isFinite(value) || value < 0) return;
    this.updateCategoryBudget(cat, value);
    this.cancelEditCategory();
  }
}
