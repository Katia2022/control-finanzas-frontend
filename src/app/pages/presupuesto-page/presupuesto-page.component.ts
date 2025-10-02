import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetCardComponent } from '../../components/budget-card/budget-card.component';
import { TransactionsService } from '../../services/transactions.service';
import { SavingsService } from '../../services/savings.service';
import { computed } from '@angular/core';
import { CategoriesService } from '../../services/categories.service';
import { BudgetService } from '../../services/budget.service';

@Component({
  selector: 'app-presupuesto-page',
  standalone: true,
  imports: [CommonModule, BudgetCardComponent],
  templateUrl: './presupuesto-page.component.html',
  styleUrl: './presupuesto-page.component.css'
})
export class PresupuestoPageComponent {
  readonly tx = inject(TransactionsService);
  readonly categoriesSvc = inject(CategoriesService);
  readonly savings = inject(SavingsService);
  readonly budgetSvc = inject(BudgetService);

  readonly incomeThisMonth = computed(() => {
    const key = this.tx.currentMonthKey();
    let total = 0;
    for (const t of this.tx.transactions()) {
      if (t.type !== 'income') continue;
      const d = new Date(t.date + 'T00:00');
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (k === key) total += t.amount;
    }
    return total;
  });

  readonly plannedSavingsThisMonth = computed(() =>
    this.savings.plannedForMonth(this.tx.currentMonthKey(), this.incomeThisMonth()),
  );

  readonly availableForExpenses = computed(() =>
    Math.max(0, this.incomeThisMonth() - this.plannedSavingsThisMonth()),
  );
}
