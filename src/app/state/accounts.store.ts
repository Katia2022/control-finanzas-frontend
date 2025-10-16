import { Injectable, inject, signal } from '@angular/core';
import { createStore, withProps } from '@ngneat/elf';
import { AccountsApi, AccountView } from '../api/accounts.api';

type AccountsState = {
  items: AccountView[];
  loaded: boolean;
  loadedAt?: number;
};

const accountsStore = createStore(
  { name: 'accounts' },
  withProps<AccountsState>({ items: [], loaded: false })
);

@Injectable({ providedIn: 'root' })
export class AccountsStore {
  private readonly api = inject(AccountsApi);
  // Signal to allow components to react to async load completion
  readonly itemsSig = signal<AccountView[]>([]);

  load() {
    if (accountsStore.getValue().loaded) return;
    this.api.list().subscribe({
      next: (list) => {
        const items = list || [];
        accountsStore.update((s) => ({ ...s, items, loaded: true, loadedAt: Date.now() }));
        this.itemsSig.set(items);
      },
      error: () => {
        accountsStore.update((s) => ({ ...s, items: [], loaded: false }));
        this.itemsSig.set([]);
      },
    });
  }

  refresh() {
    this.api.list().subscribe({
      next: (list) => {
        const items = list || [];
        accountsStore.update((s) => ({ ...s, items, loaded: true, loadedAt: Date.now() }));
        this.itemsSig.set(items);
      },
      error: () => {
        accountsStore.update((s) => ({ ...s, items: [], loaded: false }));
        this.itemsSig.set([]);
      },
    });
  }

  get items(): AccountView[] { return accountsStore.getValue().items; }
}
