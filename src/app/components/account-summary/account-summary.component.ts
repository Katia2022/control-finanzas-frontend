import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-account-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-summary.component.html',
  styleUrl: './account-summary.component.css',
})
export class AccountSummaryComponent {
  @Input() accountTotals: { account: string; income: number; expense: number; balance: number }[] = [];
  @Input() currencyCode!: string;
}
