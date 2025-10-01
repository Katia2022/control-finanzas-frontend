import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

interface MonthlySummary {
  key: string;
  label: string;
  income: number;
  expense: number;
}

@Component({
  selector: 'app-monthly-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './monthly-summary.component.html',
  styleUrl: './monthly-summary.component.css',
})
export class MonthlySummaryComponent {
  @Input() monthlySummaries: MonthlySummary[] = [];
  @Input() expenseByCategory: { category: string; amount: number }[] = [];
  @Input() currencyCode!: string;
}
