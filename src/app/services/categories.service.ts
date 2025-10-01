import { Injectable, inject, signal } from '@angular/core';
import { CategoriesApi } from '../api/categories.api';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly api = inject(CategoriesApi);
  readonly categories = signal<string[]>([]);
  private lastList: { id: number; name: string }[] = [];
  readonly lastError = signal<string | null>(null);
  readonly lastInfo = signal<string | null>(null);

  constructor() {
    this.refresh();
  }

  add(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.api.create(trimmed).subscribe({
      next: () => { this.lastInfo.set('Categoría creada.'); this.lastError.set(null); this.refresh(); },
      error: () => { this.lastError.set('No se pudo crear la categoría.'); },
    });
  }

  remove(name: string): void {
    const found = this.lastList.find(c => c.name === name);
    if (!found) { this.lastError.set('Categoría no encontrada.'); return; }
    this.api.delete(found.id).subscribe({
      next: () => { this.lastInfo.set('Categoría eliminada.'); this.lastError.set(null); this.refresh(); },
      error: () => { this.lastError.set('No se pudo eliminar la categoría.'); },
    });
  }

  rename(prev: string, nextName: string): void {
    const trimmed = nextName.trim();
    if (!trimmed) return;
    const found = this.lastList.find(c => c.name === prev);
    if (!found) { this.lastError.set('Categoría no encontrada.'); return; }
    this.api.rename(found.id, trimmed).subscribe({
      next: () => { this.lastInfo.set('Categoría renombrada.'); this.lastError.set(null); this.refresh(); },
      error: () => { this.lastError.set('No se pudo renombrar la categoría.'); },
    });
  }

  ensure(name: string): void { this.add(name); }

  private update(list: string[]) { this.categories.set(list); }

  private refresh() {
    this.api.list().subscribe({ next: list => {
      this.lastList = list || [];
      this.categories.set(this.lastList.map(c => c.name).sort((a, b) => a.localeCompare(b)));
      this.lastError.set(null);
    }, error: () => this.lastError.set('No se pudieron cargar las categorías.') });
  }
}
