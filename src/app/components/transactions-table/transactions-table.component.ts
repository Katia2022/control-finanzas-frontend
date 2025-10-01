import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
  description?: string;
  amount: number;
  date: string; // ISO yyyy-MM-dd
}

@Component({
  selector: 'app-transactions-table',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transactions-table.component.html',
  styleUrl: './transactions-table.component.css',
})
export class TransactionsTableComponent {
  @Input() transactions: Transaction[] = [];
  @Input() currencyCode!: string;
  @Input() accounts: string[] = [];
  @Input() filterControl?: FormControl<string | null>;
  @Output() remove = new EventEmitter<number>();

  trackById(_: number, transaction: Transaction) { return transaction.id; }
}
