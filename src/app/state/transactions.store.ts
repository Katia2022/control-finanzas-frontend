import { Injectable, inject } from '@angular/core';
import { createStore, withProps } from '@ngneat/elf';
import { TransactionsApi, TransactionDTO } from '../api/transactions.api';

type TxBucket = { key: string; items: TransactionDTO[]; loadedAt?: number };
type TransactionsState = { byMonth: Record<string, TxBucket> };

const transactionsStore = createStore(
  { name: 'transactions' },
  withProps<TransactionsState>({ byMonth: {} })
);

@Injectable({ providedIn: 'root' })
export class TransactionsStore {
  private readonly api = inject(TransactionsApi);
  loadMonth(key: string) {
    const curr = transactionsStore.getValue().byMonth[key];
    if (curr && curr.items) return;
    this.api.list(key).subscribe({
      next: (list) => transactionsStore.update((s) => ({
        ...s,
        byMonth: { ...s.byMonth, [key]: { key, items: list || [], loadedAt: Date.now() } },
      })),
      error: () => transactionsStore.update((s) => ({
        ...s,
        byMonth: { ...s.byMonth, [key]: { key, items: [], loadedAt: Date.now() } },
      })),
    });
  }
  refreshMonth(key: string) {
    this.api.list(key).subscribe({
      next: (list) => transactionsStore.update((s) => ({
        ...s,
        byMonth: { ...s.byMonth, [key]: { key, items: list || [], loadedAt: Date.now() } },
      })),
      error: () => {},
    });
  }
  getMonth(key: string) { return transactionsStore.getValue().byMonth[key]?.items || []; }
}
