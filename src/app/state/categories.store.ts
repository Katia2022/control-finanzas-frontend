import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { createStore, withProps } from '@ngneat/elf';
import { CategoriesApi } from '../api/categories.api';

type Category = { id: number; name: string };
type CategoriesState = { items: Category[]; loaded: boolean; loadedAt?: number };

const categoriesStore = createStore(
  { name: 'categories' },
  withProps<CategoriesState>({ items: [], loaded: false })
);

@Injectable({ providedIn: 'root' })
export class CategoriesStore {
  private readonly api = inject(CategoriesApi);
  readonly items$ = new BehaviorSubject<Category[]>(categoriesStore.getValue().items);
  load() {
    if (categoriesStore.getValue().loaded) return;
    this.api.list().subscribe({
      next: (list) => {
        categoriesStore.update((s) => ({ ...s, items: list || [], loaded: true, loadedAt: Date.now() }));
        this.items$.next(list || []);
      },
      error: () => categoriesStore.update((s) => ({ ...s, items: [], loaded: false })),
    });
  }
  refresh() {
    this.api.list().subscribe({
      next: (list) => {
        categoriesStore.update((s) => ({ ...s, items: list || [], loaded: true, loadedAt: Date.now() }));
        this.items$.next(list || []);
      },
      error: () => categoriesStore.update((s) => ({ ...s, items: [], loaded: false })),
    });
  }
  get items(): Category[] { return categoriesStore.getValue().items; }
}
