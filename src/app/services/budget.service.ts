import { Injectable, inject, signal } from '@angular/core';
import { BudgetsApi } from '../api/budgets.api';
import { CategoriesApi } from '../api/categories.api';
import { FixedExpensesApi, FixedExpenseDTO } from '../api/fixed-expenses.api';

export interface FixedExpense { id: number; name: string; amount: number; category?: string; }

const FIXED_KEY = 'app.budget.fixed';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private nextId = 1;
  private readonly budgetsApi = inject(BudgetsApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly fixedApi = inject(FixedExpensesApi);
  readonly fixedExpenses = signal<FixedExpense[]>(this.loadFixed());
  readonly categoryBudgets = signal<Record<string, number>>({});
  readonly lastError = signal<string | null>(null);
  readonly lastInfo = signal<string | null>(null);
  private monthKey = this.currentMonthKey();
  private lastBudgets: { id: number; categoryName: string; amount: number }[] = [];
  private budgetsLoaded = false;
  private fixedLoaded = false;
  private defaultsSynced = false;

  constructor() {}

  ensureLoaded() {
    this.defaultsSynced = false;
    this.budgetsLoaded = false;
    this.fixedLoaded = false;
    this.refreshBudgets();
    this.refreshFixed();
  }

  private refreshBudgets() {
    this.budgetsApi.list(this.monthKey).subscribe({ next: list => {
      this.lastBudgets = (list || []).map(b => ({ id: b.id, categoryName: b.category?.name ?? '', amount: (b as any).amount ?? 0 }));
      const map: Record<string, number> = {};
      this.lastBudgets.forEach(b => { if (b.categoryName) map[b.categoryName] = b.amount; });
      this.categoryBudgets.set(map);
      this.lastError.set(null);
      this.budgetsLoaded = true;
      this.trySyncDefaultBudgets();
    }, error: () => this.lastError.set('No se pudo cargar el presupuesto.') });
  }

  addFixed(name: string, amount: number, category?: string) {
    const trimmed = name.trim();
    if (!trimmed || !Number.isFinite(amount) || amount < 0) return;
    const catName = category?.trim() || '';
    const create = (categoryId?: number) => this.fixedApi.create({ name: trimmed, amount, categoryId }).subscribe({ next: () => this.refreshFixed(), error: () => this.lastError.set('No se pudo crear el gasto fijo.') });
    if (!catName) { create(); return; }
    this.categoriesApi.list().subscribe(list => {
      const cat = (list || []).find(c => c.name === catName);
      create(cat?.id);
    });
  }

  updateFixedItem(id: number, patch: Partial<FixedExpense>) {
    const current = this.fixedExpenses().find(i => i.id === id);
    if (!current) return;
    const name = patch.name ?? current.name;
    const amount = patch.amount ?? current.amount;
    const catName = (patch.category ?? current.category) || '';
    const update = (categoryId?: number) => this.fixedApi.update(id, { name, amount, categoryId }).subscribe({ next: () => this.refreshFixed(), error: () => this.lastError.set('No se pudo actualizar el gasto fijo.') });
    if (!catName) { update(); return; }
    this.categoriesApi.list().subscribe(list => {
      const cat = (list || []).find(c => c.name === catName);
      update(cat?.id);
    });
  }

  removeFixed(id: number) {
    this.fixedApi.delete(id).subscribe({ next: () => this.refreshFixed(), error: () => this.lastError.set('No se pudo eliminar el gasto fijo.') });
  }

  setCategoryBudget(category: string, amount: number) {
    if (!category.trim() || !Number.isFinite(amount) || amount < 0) return;
    // Enforce minimum: cannot be below fixed sum for this category
    const minFixed = this.fixedSumByCategory()[category] ?? 0;
    const clamped = Math.max(amount, minFixed);
    // Find category id
    this.categoriesApi.list().subscribe(list => {
      const cat = (list || []).find(c => c.name === category);
      if (!cat) { this.lastError.set('Categoría no encontrada.'); return; }
      this.budgetsApi.upsert(cat.id, this.monthKey, clamped).subscribe({ next: () => { this.lastInfo.set('Presupuesto actualizado.'); this.refreshBudgets(); }, error: () => this.lastError.set('No se pudo actualizar el presupuesto.') });
    });
  }

  removeCategoryBudget(category: string) {
    const found = this.lastBudgets.find(b => b.categoryName === category);
    if (!found) { this.lastError.set('Presupuesto no encontrado.'); return; }
    this.budgetsApi.delete(found.id).subscribe({ next: () => { this.lastInfo.set('Presupuesto eliminado.'); this.refreshBudgets(); }, error: () => this.lastError.set('No se pudo eliminar el presupuesto.') });
  }

  private updateFixed(list: FixedExpense[]) { this.fixedExpenses.set(list); }

  private updateCategories(map: Record<string, number>) { this.categoryBudgets.set(map); }

  private loadFixed(): FixedExpense[] { return []; }

  private currentMonthKey(): string { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }

  private refreshFixed() {
    this.fixedApi.list().subscribe({ next: list => {
      const mapped: FixedExpense[] = (list || []).map((f: FixedExpenseDTO) => ({ id: f.id, name: f.name, amount: f.amount, category: f.category?.name }));
      this.updateFixed(mapped);
      this.fixedLoaded = true;
      this.trySyncDefaultBudgets();
    }, error: () => this.lastError.set('No se pudieron cargar los gastos fijos.') });
  }

  // Build a map with total fixed amounts per category name
  private fixedSumByCategory(): Record<string, number> {
    const sums: Record<string, number> = {};
    for (const fx of this.fixedExpenses()) {
      const cat = fx.category?.trim() || '';
      if (!cat) continue;
      sums[cat] = (sums[cat] ?? 0) + (Number.isFinite(fx.amount) ? fx.amount : 0);
    }
    return sums;
  }

  // Create default budgets for categories that have fixed expenses but no budget yet
  private trySyncDefaultBudgets() {
    if (this.defaultsSynced) return;
    if (!(this.budgetsLoaded && this.fixedLoaded)) return;
    const current = this.categoryBudgets();
    const fixedMap = this.fixedSumByCategory();
    const categoriesToCreate = Object.keys(fixedMap).filter(cat => (current[cat] == null));
    if (!categoriesToCreate.length) { this.defaultsSynced = true; return; }
    this.categoriesApi.list().subscribe(list => {
      const catalog = list || [];
      let pending = 0;
      for (const name of categoriesToCreate) {
        const sum = fixedMap[name];
        const cat = catalog.find(c => c.name === name);
        if (!cat || !Number.isFinite(sum) || sum <= 0) continue;
        pending++;
        this.budgetsApi.upsert(cat.id, this.monthKey, sum).subscribe({
          next: () => {
            pending--;
            if (pending === 0) {
              this.defaultsSynced = true;
              this.lastInfo.set('Presupuestos inicializados desde gastos fijos.');
              this.refreshBudgets();
            }
          },
          error: () => {
            pending--;
            this.lastError.set('No se pudo inicializar presupuesto por fijos.');
          }
        });
      }
      if (pending === 0) this.defaultsSynced = true;
    });
  }
}
