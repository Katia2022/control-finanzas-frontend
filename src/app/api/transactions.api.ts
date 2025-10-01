import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from './api.config';

export type TxType = 'INCOME' | 'EXPENSE';
export interface TransactionDTO {
  id: number; type: TxType; accountId: number; categoryId: number;
  amount: number; date: string; description?: string;
}
export interface TransactionCreateDTO {
  type: TxType; accountId: number; categoryId: number;
  amount: number; date: string; description?: string;
}

@Injectable({ providedIn: 'root' })
export class TransactionsApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(monthKey?: string) {
    const params = monthKey ? new HttpParams().set('monthKey', monthKey) : undefined;
    return this.http.get<TransactionDTO[]>(`${this.base}/transactions`, { params });
  }
  create(body: TransactionCreateDTO) {
    return this.http.post<TransactionDTO>(`${this.base}/transactions`, body);
  }
  delete(id: number) { return this.http.delete<void>(`${this.base}/transactions/${id}`); }
}

