import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PRIMENG_IMPORTS } from '../../shared/primeng';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...PRIMENG_IMPORTS],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.css',
})
export class TransactionFormComponent {
  @Input() form!: FormGroup;
  @Input() categories: string[] = [];
  @Input() accounts: string[] = [];
  @Input() fixedNames: string[] = [];
  @Input() editing = false;
  @Output() cancel = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  get categoryOptions() {
    return (this.categories || []).map((c) => ({ label: c, value: c }));
  }

  get accountOptions() {
    return (this.accounts || []).map((a) => ({ label: a, value: a }));
  }
}
