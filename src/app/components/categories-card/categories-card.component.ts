import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { PRIMENG_IMPORTS } from '../../shared/primeng';
import { CategoriesService } from '../../services/categories.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-categories-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ...PRIMENG_IMPORTS],
  templateUrl: './categories-card.component.html',
  styleUrl: './categories-card.component.css',
})
export class CategoriesCardComponent implements OnInit {
  private readonly categoriesSvc = inject(CategoriesService);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(MessageService);
  readonly categories = this.categoriesSvc.categories;
  readonly errorMsg = this.categoriesSvc.lastError;
  readonly infoMsg = this.categoriesSvc.lastInfo;

  // UI state
  newCatCtrl = this.fb.control('', { validators: [Validators.required, Validators.maxLength(40)] });
  editing = signal<string | null>(null);
  editCtrl = this.fb.control('', { validators: [Validators.required, Validators.maxLength(40)] });

  // Toast notifications when service emits messages
  readonly toastFx = effect(() => {
    const err = this.errorMsg();
    const info = this.infoMsg();
    if (err) {
      this.msg.add({ severity: 'error', summary: 'Categorías', detail: err, life: 3000 });
    }
    if (info) {
      this.msg.add({ severity: 'success', summary: 'Categorías', detail: info, life: 2000 });
    }
  });

  ngOnInit(): void {
    this.categoriesSvc.ensureLoaded?.();
  }

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
    }
    this.cancelEdit();
  }

  cancelEdit() {
    this.editing.set(null);
    this.editCtrl.reset('');
  }

  remove(name: string) {
    this.categoriesSvc.remove(name);
  }
}
