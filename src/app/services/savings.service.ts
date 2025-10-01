import { Injectable, computed, signal, inject } from '@angular/core';
import { TransactionsService } from './transactions.service';

export type SavingsPlanType = 'fixed' | 'percent';
export type SavingsPlanStatus = 'active' | 'paused';
export type SavingsMoveStatus = 'pending' | 'done' | 'failed';

export interface SavingsPlan {
  id: number;
  name: string;
  monthKey: string; // yyyy-MM
  type: SavingsPlanType;
  amountPlanned: number; // used when type === 'fixed'
  percent?: number; // fraction 0..1 when type === 'percent'
  priority: number; // lower means higher priority
  status: SavingsPlanStatus;
  sourceAccount?: string;
  targetAccount?: string;
}

export interface SavingsMove {
  id: number;
  planId: number;
  date: string; // ISO yyyy-MM-dd
  amount: number;
  status: SavingsMoveStatus;
  note?: string;
}

const PLANS_KEY = 'app.savings.plans';
const MOVES_KEY = 'app.savings.moves';

@Injectable({ providedIn: 'root' })
export class SavingsService {
  private readonly tx = inject(TransactionsService);
  private nextPlanId = 1;
  private nextMoveId = 1;

  readonly plans = signal<SavingsPlan[]>(this.loadPlans());
  readonly moves = signal<SavingsMove[]>(this.loadMoves());

  // Helpers
  readonly currentMonthKey = computed(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  addPlan(plan: Omit<SavingsPlan, 'id'>) {
    const id = this.nextPlanId++;
    const clean: SavingsPlan = {
      ...plan,
      id,
      name: plan.name.trim(),
      amountPlanned: Math.max(0, Number(plan.amountPlanned || 0)),
      percent: plan.type === 'percent' ? Math.max(0, Math.min(1, Number(plan.percent || 0))) : undefined,
      priority: Number.isFinite(plan.priority) ? plan.priority : 1,
      status: plan.status ?? 'active',
    };
    this.plans.update((curr) => [clean, ...curr]);
    this.savePlans();
  }

  updatePlan(id: number, patch: Partial<SavingsPlan>) {
    this.plans.update((list) => list.map(p => p.id === id ? { ...p, ...patch } : p));
    this.savePlans();
  }

  removePlan(id: number) {
    this.plans.update((list) => list.filter(p => p.id !== id));
    this.moves.update((list) => list.filter(m => m.planId !== id));
    this.savePlans();
    this.saveMoves();
  }

  plannedForMonth(monthKey: string, totalIncome?: number) {
    const income = Number(totalIncome || 0);
    let total = 0;
    for (const p of this.plans()) {
      if (p.status !== 'active' || p.monthKey !== monthKey) continue;
      if (p.type === 'fixed') total += p.amountPlanned;
      else total += Math.round(((p.percent || 0) * income) * 100) / 100;
    }
    return total;
  }

  executedForMonth(monthKey: string) {
    let total = 0;
    for (const m of this.moves()) {
      if (m.status !== 'done') continue;
      const d = new Date(m.date + 'T00:00');
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (k === monthKey) total += m.amount;
    }
    return total;
  }

  scheduleMonthMoves(monthKey: string, totalIncome?: number) {
    const income = Number(totalIncome || 0);
    const planned: SavingsMove[] = [];
    for (const p of this.plans()) {
      if (p.status !== 'active' || p.monthKey !== monthKey) continue;
      const amount = p.type === 'fixed' ? p.amountPlanned : Math.round(((p.percent || 0) * income) * 100) / 100;
      if (!(amount > 0)) continue;
      planned.push({
        id: this.nextMoveId++,
        planId: p.id,
        date: `${monthKey}-01`,
        amount,
        status: 'pending',
      });
    }
    if (planned.length) {
      this.moves.update((curr) => [...planned, ...curr]);
      this.saveMoves();
    }
  }

  markMoveDone(id: number) {
    const move = this.moves().find(m => m.id === id);
    if (!move) return;
    const plan = this.plans().find(p => p.id === move.planId);
    // If plan has both accounts, create a transfer (expense in source, income in target)
    if (plan?.sourceAccount && plan?.targetAccount) {
      const category = 'Ahorro';
      const description = `Ahorro: ${plan.name}`;
      const date = move.date;
      const amount = move.amount;
      // Expense from source
      this.tx.addTransaction({
        type: 'expense',
        category,
        account: plan.sourceAccount,
        description,
        amount,
        date,
      });
      // Income into target
      this.tx.addTransaction({
        type: 'income',
        category,
        account: plan.targetAccount,
        description,
        amount,
        date,
      });
    }
    this.moves.update((list) => list.map(m => m.id === id ? { ...m, status: 'done' } : m));
    this.saveMoves();
  }

  retryMove(id: number) {
    this.moves.update((list) => list.map(m => m.id === id ? { ...m, status: 'pending' } : m));
    this.saveMoves();
  }

  private savePlans() { localStorage.setItem(PLANS_KEY, JSON.stringify(this.plans())); }
  private saveMoves() { localStorage.setItem(MOVES_KEY, JSON.stringify(this.moves())); }

  private loadPlans(): SavingsPlan[] {
    try {
      const raw = localStorage.getItem(PLANS_KEY);
      const list = raw ? (JSON.parse(raw) as SavingsPlan[]) : [];
      const maxId = list.reduce((m, it) => Math.max(m, it.id), 0);
      this.nextPlanId = Math.max(1, maxId + 1);
      return list;
    } catch {
      return [];
    }
  }

  private loadMoves(): SavingsMove[] {
    try {
      const raw = localStorage.getItem(MOVES_KEY);
      const list = raw ? (JSON.parse(raw) as SavingsMove[]) : [];
      const maxId = list.reduce((m, it) => Math.max(m, it.id), 0);
      this.nextMoveId = Math.max(1, maxId + 1);
      return list;
    } catch {
      return [];
    }
  }
}
