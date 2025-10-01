import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'app.categories';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  readonly categories = signal<string[]>(this.load());

  add(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const set = new Set(this.categories());
    set.add(trimmed);
    this.update([...set].sort((a, b) => a.localeCompare(b)));
  }

  remove(name: string): void {
    const next = this.categories().filter(c => c !== name);
    this.update(next);
  }

  rename(prev: string, nextName: string): void {
    const trimmed = nextName.trim();
    if (!trimmed) return;
    const list = this.categories().map(c => (c === prev ? trimmed : c));
    this.update(Array.from(new Set(list)).sort((a, b) => a.localeCompare(b)));
  }

  ensure(name: string): void { this.add(name); }

  private update(list: string[]) {
    this.categories.set(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  private load(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }
}

