import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { PRIMENG_IMPORTS } from '../../shared/primeng';
import { Table } from 'primeng/table';

import { TxTypeLabelPipe, TxTypeSeverityPipe } from '../../shared/pipes/transaction-type.pipe';

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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ...PRIMENG_IMPORTS,
    TxTypeLabelPipe,
    TxTypeSeverityPipe,
  ],
  templateUrl: './transactions-table.component.html',
  styleUrl: './transactions-table.component.css',
})
export class TransactionsTableComponent {
  @ViewChild(Table) dt?: Table;
  @Input() transactions: Transaction[] = [];
  @Input() currencyCode!: string;
  @Input() accounts: string[] = [];
  @Input() categories: string[] = [];
  @Input() filterControl?: FormControl<string | null>;
  @Output() remove = new EventEmitter<number>();
  @Output() editTx = new EventEmitter<Transaction>();
  @Output() updateTx = new EventEmitter<{ id: number; data: Omit<Transaction, 'id'> }>();

  editingId: number | null = null;
  draft: Omit<Transaction, 'id'> | null = null;
    searchValue: string | undefined;

    clear(table: Table) {
        table.clear();
        this.searchValue = ''
    }
  trackById(_: number, transaction: Transaction) {
    return transaction.id;
  }

  startInlineEdit(transactionService: Transaction) {
    this.editingId = transactionService.id;
    this.draft = {
      type: transactionService.type,
      category: transactionService.category,
      account: transactionService.account,
      description: transactionService.description,
      amount: transactionService.amount,
      date: transactionService.date,
    };
  }

  cancelInlineEdit() {
    this.editingId = null;
    this.draft = null;
  }

  saveInlineEdit() {
    if (this.editingId == null || this.draft == null) return;
    const d = this.draft;
    const category = (d.category || '').toString().trim();
    const account = (d.account || '').toString().trim();
    const date = (d.date || '').toString();
    const amount = Number(d.amount);
    if (!category || !account || !date || !Number.isFinite(amount) || amount <= 0) {
      return; // simple guard; UI could be enhanced to show errors
    }
    this.updateTx.emit({ id: this.editingId, data: { ...d, category, account, date, amount } });
    this.cancelInlineEdit();
  }

  get categoryOptions() {
    return (this.categories || []).map((c) => ({ label: c, value: c }));
  }
  get accountOptions() {
    return (this.accounts || []).map((a) => ({ label: a, value: a }));
  }
  // Return rows currently visible in the p-table after applying its filters
  visibleRows(): Transaction[] {
    const table = this.dt as Table | undefined;
    const filtered = (table as any)?.filteredValue as Transaction[] | undefined;
    if (Array.isArray(filtered)) return filtered;
    return this.transactions || [];
  }
}
