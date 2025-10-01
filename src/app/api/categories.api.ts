import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from './api.config';

export interface Category { id: number; name: string; }

@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  list() { return this.http.get<Category[]>(`${this.base}/categories`); }
  create(name: string) { return this.http.post<Category>(`${this.base}/categories`, { name }); }
  rename(id: number, name: string) { return this.http.patch<Category>(`${this.base}/categories/${id}`, { name }); }
  delete(id: number) { return this.http.delete<void>(`${this.base}/categories/${id}`); }
}

