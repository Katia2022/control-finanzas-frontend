import { Injectable, signal } from '@angular/core';

export interface FixedExpense { id: number; name: string; amount: number; category?: string; }

const FIXED_KEY = 'app.budget.fixed';
const CAT_KEY = 'app.budget.categories';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private nextId = 1;
  readonly fixedExpenses = signal<FixedExpense[]>(this.loadFixed());
  readonly categoryBudgets = signal<Record<string, number>>(this.loadCategories());

  addFixed(name: string, amount: number, category?: string) {
    const trimmed = name.trim();
    if (!trimmed || !Number.isFinite(amount) || amount < 0) return;
    const item: FixedExpense = { id: this.nextId++, name: trimmed, amount, category: category?.trim() || undefined };
    this.updateFixed([item, ...this.fixedExpenses()]);
  }

  updateFixedItem(id: number, patch: Partial<FixedExpense>) {
    this.updateFixed(this.fixedExpenses().map(i => i.id === id ? { ...i, ...patch } : i));
  }

  removeFixed(id: number) {
    this.updateFixed(this.fixedExpenses().filter(i => i.id !== id));
  }

  setCategoryBudget(category: string, amount: number) {
    if (!category.trim() || !Number.isFinite(amount) || amount < 0) return;
    const next = { ...this.categoryBudgets(), [category]: amount };
    this.updateCategories(next);
  }

  removeCategoryBudget(category: string) {
    const next = { ...this.categoryBudgets() };
    delete next[category];
    this.updateCategories(next);
  }

  private updateFixed(list: FixedExpense[]) {
    this.fixedExpenses.set(list);
    localStorage.setItem(FIXED_KEY, JSON.stringify(list));
  }

  private updateCategories(map: Record<string, number>) {
    this.categoryBudgets.set(map);
    localStorage.setItem(CAT_KEY, JSON.stringify(map));
  }

  private loadFixed(): FixedExpense[] {
    try { const raw = localStorage.getItem(FIXED_KEY); if (raw) return JSON.parse(raw); } catch {}
    return [];
  }

  private loadCategories(): Record<string, number> {
    try { const raw = localStorage.getItem(CAT_KEY); if (raw) return JSON.parse(raw); } catch {}
    return {};
  }
}
