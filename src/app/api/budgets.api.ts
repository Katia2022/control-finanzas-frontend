import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from './api.config';

export interface BudgetCategory {
  id: number; category: { id: number; name: string }; monthKey: string; amount: number;
}

@Injectable({ providedIn: 'root' })
export class BudgetsApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  list(monthKey?: string) {
    const params = monthKey ? new HttpParams().set('monthKey', monthKey) : undefined;
    return this.http.get<BudgetCategory[]>(`${this.base}/budgets/categories`, { params });
  }
  upsert(categoryId: number, monthKey: string, amount: number) {
    return this.http.put<BudgetCategory>(`${this.base}/budgets/categories/${categoryId}`, { categoryId, monthKey, amount });
  }
  delete(id: number) { return this.http.delete<void>(`${this.base}/budgets/categories/${id}`); }
}

