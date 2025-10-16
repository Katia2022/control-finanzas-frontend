import { CommonModule } from '@angular/common';
import { PRIMENG_IMPORTS } from '../../shared/primeng';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-account-summary',
  standalone: true,
  imports: [CommonModule, ...PRIMENG_IMPORTS],
  templateUrl: './account-summary.component.html',
  styleUrl: './account-summary.component.css',
})
export class AccountSummaryComponent {
  @Input() accountTotals: { account: string; income: number; expense: number; balance: number }[] = [];
  @Input() currencyCode!: string;
  @Input() header: string = 'Resumen por cuenta';
  @Input() subheader: string = 'Distribución de gastos por cuenta.';
  @Input() incomeLabel: string = 'Ingresos';
  @Input() expenseLabel: string = 'Gastos';
  @Input() embedded: boolean = false;
}
