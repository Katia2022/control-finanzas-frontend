import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroBalanceComponent } from '../../components/hero-balance/hero-balance.component';
import { InsightCardComponent } from '../../components/insight-card/insight-card.component';
import { MonthlySummaryComponent } from '../../components/monthly-summary/monthly-summary.component';
import { CategorySummaryComponent } from '../../components/category-summary/category-summary.component';
import { AccountSummaryComponent } from '../../components/account-summary/account-summary.component';
import { TransactionsService } from '../../services/transactions.service';
// Removed AccountsStore/AccountsService to avoid double backend calls

@Component({
  selector: 'app-summary-page',
  standalone: true,
  imports: [
    CommonModule,
    HeroBalanceComponent,
    InsightCardComponent,
    MonthlySummaryComponent,
    CategorySummaryComponent,
    AccountSummaryComponent,
  ],
  templateUrl: './summary-page.component.html',
  styleUrl: './summary-page.component.css',
})
export class SummaryPageComponent implements OnInit {
  readonly transactionService = inject(TransactionsService);
  // Totals por tipo derivados directamente del servicio (sin estado local)
  readonly operatingAccountTotals = this.transactionService.operatingAccountTotals;
  readonly savingsAccountTotals = this.transactionService.savingsAccountTotals;

  // Header totals (only operating accounts)
  readonly operatingTotalIncome = this.transactionService.operatingTotalIncome;
  readonly operatingTotalExpense = this.transactionService.operatingTotalExpense;
  readonly operatingBalance = this.transactionService.operatingBalanceTotal;
  readonly operatingSavingsRate = this.transactionService.operatingSavingsRate;

  // Accumulated total in savings accounts
  readonly totalSavings = this.transactionService.totalSavingsBalance;

  // Accordion persistence
  private static readonly ACCORDION_KEY = 'summary.sections.open';
  private static readonly NUM_SECTIONS = 4;
  activeOpen: boolean[] = new Array<boolean>(SummaryPageComponent.NUM_SECTIONS).fill(false);

  ngOnInit(): void {
    // Lazy-load only what's needed for esta vista
    this.transactionService.ensureMonthLoaded();
    // Restore sections open state
    try {
      const raw = localStorage.getItem(SummaryPageComponent.ACCORDION_KEY);
      const arr = raw ? JSON.parse(raw) : null;
      if (Array.isArray(arr)) {
        const filled = new Array<boolean>(SummaryPageComponent.NUM_SECTIONS).fill(false);
        for (let i = 0; i < Math.min(arr.length, filled.length); i++) filled[i] = !!arr[i];
        this.activeOpen = filled;
      }
    } catch {}
  }

  private persist() {
    try { localStorage.setItem(SummaryPageComponent.ACCORDION_KEY, JSON.stringify(this.activeOpen)); } catch {}
  }
  onToggle(idx: number, open: boolean) {
    this.activeOpen[idx] = !!open;
    this.persist();
  }
  onToggleEvent(idx: number, ev: Event) {
    const open = (ev?.target as HTMLDetailsElement | null)?.open ?? false;
    this.onToggle(idx, open);
  }
  expandAll() { this.activeOpen = new Array<boolean>(SummaryPageComponent.NUM_SECTIONS).fill(true); this.persist(); }
  collapseAll() { this.activeOpen = new Array<boolean>(SummaryPageComponent.NUM_SECTIONS).fill(false); this.persist(); }
}
