import { Injectable, inject, signal } from '@angular/core';
import { AccountsApi, AccountView } from '../api/accounts.api';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly api = inject(AccountsApi);
  readonly accounts = signal<string[]>([]);
  readonly initialBalances = signal<Record<string, number>>({});
  readonly lastError = signal<string | null>(null);
  readonly lastInfo = signal<string | null>(null);
  private lastList: AccountView[] = [];

  constructor() {
    this.refresh();
  }

  add(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const set = new Set(this.accounts());
    set.add(trimmed);
    this.update([...set].sort((a, b) => a.localeCompare(b)));
  }

  remove(name: string): void {
    const acc = this.lastList.find(a => a.name === name);
    if (!acc) { this.lastError.set('Cuenta no encontrada.'); return; }
    this.api.delete(acc.id).subscribe({
      next: () => { this.lastInfo.set('Cuenta eliminada.'); this.lastError.set(null); this.refresh(); },
      error: () => { this.lastError.set('No se pudo eliminar la cuenta (puede tener movimientos asociados).'); },
    });
  }

  rename(prev: string, nextName: string): void {
    const trimmed = nextName.trim();
    if (!trimmed) return;
    const acc = this.lastList.find(a => a.name === prev);
    if (!acc) { this.lastError.set('Cuenta no encontrada.'); return; }
    this.api.update(acc.id, { name: trimmed }).subscribe({
      next: () => { this.lastInfo.set('Cuenta renombrada.'); this.lastError.set(null); this.refresh(); },
      error: (err) => { this.lastError.set(err?.status === 409 ? 'Ya existe una cuenta con ese nombre.' : 'No se pudo renombrar la cuenta.'); },
    });
  }

  ensure(name: string): void { this.add(name); }

  private update(list: string[]) { this.accounts.set(list); }

  setInitial(name: string, amount: number) {
    if (!name.trim() || !Number.isFinite(amount)) return;
    const acc = this.lastList.find(a => a.name === name);
    if (!acc) { this.lastError.set('Cuenta no encontrada.'); return; }
    this.api.update(acc.id, { initialBalance: amount }).subscribe({
      next: () => {
        const map = { ...this.initialBalances() };
        map[name] = amount;
        this.updateInitials(map);
        this.lastInfo.set('Saldo inicial actualizado.'); this.lastError.set(null);
      },
      error: () => { this.lastError.set('No se pudo actualizar el saldo inicial.'); },
    });
  }

  getInitial(name: string): number {
    const v = this.initialBalances()[name];
    return Number.isFinite(v as number) ? (v as number) : 0;
  }

  private updateInitials(map: Record<string, number>) { this.initialBalances.set(map); }

  private refresh() {
    this.api.list().subscribe({
      next: (list) => {
        this.lastList = list;
        this.accounts.set(list.map(a => a.name).sort((a, b) => a.localeCompare(b)));
        const initials: Record<string, number> = {};
        list.forEach(a => { initials[a.name] = a.initialBalance ?? 0; });
        this.initialBalances.set(initials);
        this.lastError.set(null);
      },
      error: () => this.lastError.set('No se pudieron cargar las cuentas.'),
    });
  }
}
