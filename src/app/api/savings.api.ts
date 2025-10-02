import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from './api.config';

export type PlanType = 'FIXED' | 'PERCENT';
export type PlanStatus = 'ACTIVE' | 'PAUSED';
export interface SavingsPlanView {
  id: number; name: string; monthKey: string; type: PlanType;
  amountPlanned: number; percent?: number | null; priority: number; status: PlanStatus;
  sourceAccountId?: number | null; targetAccountId?: number | null;
}
export interface SavingsPlanCreate {
  name: string; monthKey: string; type: PlanType; amountPlanned: number; percent?: number; priority?: number; status?: PlanStatus;
  sourceAccountId?: number; targetAccountId?: number;
}
export type SavingsPlanUpdate = Partial<SavingsPlanCreate>;

export type MoveStatus = 'PENDING' | 'DONE' | 'FAILED';
export interface SavingsMoveView { id: number; planId: number; date: string; amount: number; status: MoveStatus; note?: string; }

@Injectable({ providedIn: 'root' })
export class SavingsApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  listPlans(monthKey?: string) {
    const params = monthKey ? new HttpParams().set('monthKey', monthKey) : undefined;
    return this.http.get<SavingsPlanView[]>(`${this.base}/savings/plans`, { params });
  }
  createPlan(body: SavingsPlanCreate) {
    return this.http.post<SavingsPlanView>(`${this.base}/savings/plans`, body);
  }
  updatePlan(id: number, body: SavingsPlanUpdate) {
    return this.http.patch<SavingsPlanView>(`${this.base}/savings/plans/${id}`, body);
  }
  deletePlan(id: number) { return this.http.delete<void>(`${this.base}/savings/plans/${id}`); }

  listMoves(monthKey?: string) {
    const params = monthKey ? new HttpParams().set('monthKey', monthKey) : undefined;
    return this.http.get<SavingsMoveView[]>(`${this.base}/savings/moves`, { params });
  }
  scheduleMoves(monthKey: string, totalIncome?: number) {
    let params = new HttpParams().set('monthKey', monthKey);
    if (typeof totalIncome === 'number') params = params.set('totalIncome', String(totalIncome));
    return this.http.post<SavingsMoveView[]>(`${this.base}/savings/moves/schedule`, null, { params });
  }
  markMoveDone(id: number) {
    return this.http.post<SavingsMoveView>(`${this.base}/savings/moves/${id}/done`, {});
  }
}

