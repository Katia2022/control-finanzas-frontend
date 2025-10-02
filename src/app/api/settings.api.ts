import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from './api.config';

export interface AppSettingsDTO { savingsMinRate: number; currencyCode?: 'MXN' | 'USD' | 'EUR'; monthCutoffDay?: number; }

@Injectable({ providedIn: 'root' })
export class SettingsApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  get() { return this.http.get<AppSettingsDTO>(`${this.base}/settings`); }
  patch(body: Partial<AppSettingsDTO>) { return this.http.patch<AppSettingsDTO>(`${this.base}/settings`, body); }
}
