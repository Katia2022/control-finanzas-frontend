import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from './api.config';

export interface AdHocResult { expenseTransactionId: number; incomeTransactionId: number }

@Injectable({ providedIn: 'root' })
export class SavingsApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  // Ahorro puntual: transferencia entre cuentas (operativa <-> ahorro)
  adHoc(body: { sourceAccountId: number; targetAccountId: number; date: string; amount: number; note?: string }) {
    return this.http.post<AdHocResult>(`${this.base}/savings/transfer`, body);
  }
}
