import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'app.accounts';
const INITIALS_KEY = 'app.accounts.initials';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  readonly accounts = signal<string[]>(this.load());
  readonly initialBalances = signal<Record<string, number>>(this.loadInitials());

  add(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const set = new Set(this.accounts());
    set.add(trimmed);
    this.update([...set].sort((a, b) => a.localeCompare(b)));
  }

  remove(name: string): void {
    const next = this.accounts().filter(c => c !== name);
    this.update(next);
    // Remove initial balance for this account
    const map = { ...this.initialBalances() };
    delete map[name];
    this.updateInitials(map);
  }

  rename(prev: string, nextName: string): void {
    const trimmed = nextName.trim();
    if (!trimmed) return;
    const list = this.accounts().map(c => (c === prev ? trimmed : c));
    this.update(Array.from(new Set(list)).sort((a, b) => a.localeCompare(b)));
    // Move initial balance key if exists
    const map = { ...this.initialBalances() };
    if (map[prev] != null) {
      const val = map[prev];
      delete map[prev];
      map[trimmed] = val;
      this.updateInitials(map);
    }
  }

  ensure(name: string): void { this.add(name); }

  private update(list: string[]) {
    this.accounts.set(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  setInitial(name: string, amount: number) {
    if (!name.trim() || !Number.isFinite(amount)) return;
    const map = { ...this.initialBalances() };
    map[name] = amount;
    this.updateInitials(map);
  }

  getInitial(name: string): number {
    const v = this.initialBalances()[name];
    return Number.isFinite(v as number) ? (v as number) : 0;
  }

  private updateInitials(map: Record<string, number>) {
    this.initialBalances.set(map);
    localStorage.setItem(INITIALS_KEY, JSON.stringify(map));
  }

  private load(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  private loadInitials(): Record<string, number> {
    try {
      const raw = localStorage.getItem(INITIALS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  }
}
