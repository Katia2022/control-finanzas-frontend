import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountsService } from '../../services/accounts.service';

@Component({
  selector: 'app-accounts-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './accounts-card.component.html',
  styleUrl: './accounts-card.component.css',
})
export class AccountsCardComponent {
  @Output() renamed = new EventEmitter<{ prev: string; next: string }>();
  @Output() removed = new EventEmitter<string>();
  private readonly accountsSvc = inject(AccountsService);
  private readonly fb = inject(FormBuilder);
  readonly accounts = this.accountsSvc.accounts;

  // UI state
  newAccCtrl = this.fb.control('', { validators: [Validators.required, Validators.maxLength(40)] });
  editing = signal<string | null>(null);
  editCtrl = this.fb.control('', { validators: [Validators.required, Validators.maxLength(40)] });

  add() {
    if (this.newAccCtrl.invalid) { this.newAccCtrl.markAsTouched(); return; }
    const v = (this.newAccCtrl.value ?? '').toString().trim();
    if (!v) { this.newAccCtrl.markAsTouched(); return; }
    this.accountsSvc.add(v);
    this.newAccCtrl.reset('');
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
      this.accountsSvc.rename(prev, val);
      this.renamed.emit({ prev, next: val });
    }
    this.cancelEdit();
  }

  cancelEdit() {
    this.editing.set(null);
    this.editCtrl.reset('');
  }

  remove(name: string) {
    this.accountsSvc.remove(name);
    this.removed.emit(name);
  }

  initialOf(name: string): number { return this.accountsSvc.getInitial(name); }
  updateInitial(name: string, value: number | null) {
    if (value == null || !Number.isFinite(value)) return;
    this.accountsSvc.setInitial(name, Number(value));
  }
}
