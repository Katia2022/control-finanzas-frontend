import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'app.settings';

export interface AppSettings {
  savingsMinRate: number; // fraction 0..1
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly settings = signal<AppSettings>(this.load());

  setSavingsMinRate(rateFraction: number) {
    const clamped = Math.max(0, Math.min(1, rateFraction));
    this.update({ ...this.settings(), savingsMinRate: clamped });
  }

  private update(next: AppSettings) {
    this.settings.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private load(): AppSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as AppSettings;
    } catch {}
    return { savingsMinRate: 0.1 };
  }
}

