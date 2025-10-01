import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriesService } from '../../services/categories.service';

@Component({
  selector: 'app-categories-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories-card.component.html',
  styleUrl: './categories-card.component.css',
})
export class CategoriesCardComponent {
  @Output() renamed = new EventEmitter<{ prev: string; next: string }>();
  @Output() removed = new EventEmitter<string>();
  private readonly categoriesSvc = inject(CategoriesService);
  private readonly fb = inject(FormBuilder);
  readonly categories = this.categoriesSvc.categories;

  // UI state
  newCatCtrl = this.fb.control('', { validators: [Validators.required, Validators.maxLength(40)] });
  editing = signal<string | null>(null);
  editCtrl = this.fb.control('', { validators: [Validators.required, Validators.maxLength(40)] });

  add() {
    if (this.newCatCtrl.invalid) { this.newCatCtrl.markAsTouched(); return; }
    const v = (this.newCatCtrl.value ?? '').toString().trim();
    if (!v) { this.newCatCtrl.markAsTouched(); return; }
    this.categoriesSvc.add(v);
    this.newCatCtrl.reset('');
  }

  startEdit(name: string) {
    this.editing.set(name);
    this.editCtrl.reset(name);
  }

  saveEdit() {
    const prev = this.editing();
    if (this.editCtrl.invalid) { this.editCtrl.markAsTouched(); return; }
    const val = (this.editCtrl.value ?? '').toString().trim();
    if (prev && val) {
      this.categoriesSvc.rename(prev, val);
      this.renamed.emit({ prev, next: val });
    }
    this.cancelEdit();
  }

  cancelEdit() {
    this.editing.set(null);
    this.editCtrl.reset('');
  }

  remove(name: string) {
    this.categoriesSvc.remove(name);
    this.removed.emit(name);
  }
}
