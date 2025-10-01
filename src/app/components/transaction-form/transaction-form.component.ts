import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.css',
})
export class TransactionFormComponent {
  @Input() form!: FormGroup;
  @Input() categories: string[] = [];
  @Input() accounts: string[] = [];
  @Input() fixedNames: string[] = [];
  @Output() submitted = new EventEmitter<void>();
}
