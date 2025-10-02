import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroBalanceComponent } from '../../components/hero-balance/hero-balance.component';
import { InsightCardComponent } from '../../components/insight-card/insight-card.component';
import { MonthlySummaryComponent } from '../../components/monthly-summary/monthly-summary.component';
import { CategorySummaryComponent } from '../../components/category-summary/category-summary.component';
import { AccountSummaryComponent } from '../../components/account-summary/account-summary.component';
import { TransactionsService } from '../../services/transactions.service';

@Component({
  selector: 'app-resumen-page',
  standalone: true,
  imports: [CommonModule, HeroBalanceComponent, InsightCardComponent, MonthlySummaryComponent, CategorySummaryComponent, AccountSummaryComponent],
  templateUrl: './resumen-page.component.html',
  styleUrl: './resumen-page.component.css'
})
export class ResumenPageComponent {
  readonly tx = inject(TransactionsService);
}
