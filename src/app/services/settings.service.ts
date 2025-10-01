import { Injectable, inject, signal } from '@angular/core';
import { SettingsApi } from '../api/settings.api';

export interface AppSettings {
  savingsMinRate: number; // fraction 0..1
  currencyCode: 'MXN' | 'USD' | 'EUR';
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly api = inject(SettingsApi);
  readonly settings = signal<AppSettings>({ savingsMinRate: 0.1, currencyCode: 'EUR' });

  constructor() {
    this.api.get().subscribe(dto => {
      this.settings.set({ savingsMinRate: dto.savingsMinRate ?? 0.1, currencyCode: dto.currencyCode ?? 'MXN' });
    });
  }

  setSavingsMinRate(rateFraction: number) {
    const clamped = Math.max(0, Math.min(1, rateFraction));
    this.update({ ...this.settings(), savingsMinRate: clamped });
  }

  private update(next: AppSettings) { this.settings.set(next); this.api.patch(next).subscribe(); }

  setCurrency(code: 'MXN' | 'USD' | 'EUR') {
    const next = { ...this.settings(), currencyCode: code };
    this.update(next);
  }
}
