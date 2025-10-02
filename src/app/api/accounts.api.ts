import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from './api.config';

export type AccountType = 'OPERATIVA' | 'AHORRO';
export interface AccountView { id: number; name: string; initialBalance: number; type: AccountType; }
export interface AccountCreate { name: string; initialBalance?: number; type?: AccountType; }
export interface AccountUpdate { name?: string; initialBalance?: number; type?: AccountType; }

@Injectable({ providedIn: 'root' })
export class AccountsApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list() { return this.http.get<AccountView[]>(`${this.base}/accounts`); }
  create(body: AccountCreate) { return this.http.post<AccountView>(`${this.base}/accounts`, body); }
  update(id: number, body: AccountUpdate) { return this.http.patch<AccountView>(`${this.base}/accounts/${id}`, body); }
  delete(id: number) { return this.http.delete<void>(`${this.base}/accounts/${id}`); }
}
