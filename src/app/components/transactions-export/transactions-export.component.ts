import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { PRIMENG_IMPORTS } from '../../shared/primeng';
import { FormsModule } from '@angular/forms';

export interface TxExportRow {
  id: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
  account: string;
  description?: string;
  amount: number;
}

@Component({
  selector: 'app-transactions-export',
  standalone: true,
  imports: [CommonModule, FormsModule, ...PRIMENG_IMPORTS],
  templateUrl: './transactions-export.component.html',
  styleUrl: './transactions-export.component.css',
})
export class TransactionsExportComponent {
  @Input() transactions: TxExportRow[] = [];

  filename = signal('movimientos.csv');
  delimiter = signal(',');
  includeHeader = signal(true);

  // Derive preview count on the fly from current @Input
  previewCount(): number {
    return Math.min(5, (this.transactions?.length || 0));
  }

  exportNow() {
    const rows = this.transactions || [];
    const delim = this.delimiter();
    const esc = (v: unknown) => {
      const s = (v ?? '').toString();
      if (s.includes('"') || s.includes(delim) || /[\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const headers = ['id', 'date', 'type', 'category', 'account', 'description', 'amount'];
    const parts: string[] = [];
    if (this.includeHeader()) parts.push(headers.join(delim));
    for (const r of rows) {
      parts.push([
        esc(r.id),
        esc(r.date),
        esc(r.type),
        esc(r.category),
        esc(r.account),
        esc(r.description || ''),
        esc(r.amount.toFixed(2)),
      ].join(delim));
    }
    const blob = new Blob([parts.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (this.filename() || 'movimientos.csv').replace(/\s+/g, '_');
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }
}
