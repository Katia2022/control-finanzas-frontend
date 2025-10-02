import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from './api.config';

export interface FixedExpenseDTO { id: number; name: string; amount: number; category?: { id: number; name: string } }
export interface FixedExpenseCreate { name: string; amount: number; categoryId?: number }
export type FixedExpenseUpdate = Partial<FixedExpenseCreate>;

@Injectable({ providedIn: 'root' })
export class FixedExpensesApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  list() { return this.http.get<FixedExpenseDTO[]>(`${this.base}/fixed-expenses`); }
  create(body: FixedExpenseCreate) { return this.http.post<FixedExpenseDTO>(`${this.base}/fixed-expenses`, body); }
  update(id: number, body: FixedExpenseUpdate) { return this.http.patch<FixedExpenseDTO>(`${this.base}/fixed-expenses/${id}`, body); }
  delete(id: number) { return this.http.delete<void>(`${this.base}/fixed-expenses/${id}`); }
}

