import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetCardComponent } from '../../components/budget-card/budget-card.component';
import { TransactionsService } from '../../services/transactions.service';
import { computed } from '@angular/core';
import { CategoriesStore } from '../../state/categories.store';
import { BudgetService } from '../../services/budget.service';
import { effect } from '@angular/core';

@Component({
  selector: 'app-budget-page',
  standalone: true,
  imports: [CommonModule, BudgetCardComponent],
  templateUrl: './budget-page.component.html',
  styleUrl: './budget-page.component.css',
})
export class BudgetPageComponent implements OnInit {
  readonly transactionService = inject(TransactionsService);
  private readonly categoriesStore = inject(CategoriesStore);
  readonly budgetSvc = inject(BudgetService);
  categoryNames: string[] = [];
  // Tope para planificación (periodo de corte):
  // saldos iniciales OPERATIVAS (apertura del periodo)
  // + ingresos OPERATIVAS del periodo
  // - ahorro neto del periodo (depósitos netos a cuentas de ahorro)
  readonly planningCap = computed(() => {
    try {
      const mk = this.transactionService.currentMonthKey();
      // Saldos de apertura solo de cuentas OPERATIVAS
      const openingOp = this.transactionService
        .operatingAccountTotals()
        .reduce((s, a) => s + (Number.isFinite(a.initial) ? a.initial : 0), 0);

      // Ingresos del periodo (fecha entre periodStart..periodEnd) en cuentas OPERATIVAS
      const typeBy = this.transactionService.accountTypeByName();
      const excludeIds = this.transactionService.transferIds();
      const ps = this.transactionService.periodStart();
      const pe = this.transactionService.periodEnd();
      const start = new Date(ps + 'T00:00');
      const end = new Date(pe + 'T23:59:59');
      const income = this.transactionService
        .transactions()
        .filter((t) =>
          t.type === 'income' &&
          typeBy.get(t.account) === 'OPERATIVA' &&
          !excludeIds.has(t.id) &&
          t.category !== 'Transferencia interna' &&
          (() => { const d = new Date(t.date + 'T00:00'); return d >= start && d <= end; })()
        )
        .reduce((s, t) => s + t.amount, 0);

      // Ahorro neto del periodo (depósitos - retiros en cuentas de ahorro)
      const svMap = this.transactionService.monthlySavingsByKey();
      const savingsNet = Math.max(0, svMap[mk] || 0);

      return Math.max(0, openingOp + income - savingsNet);
    } catch {
      return 0;
    }
  });

  // Debug: breakdown for planning cap
  readonly debugCapFx = effect(() => {
    try {
      const mk = this.transactionService.currentMonthKey();
      const ps = this.transactionService.periodStart();
      const pe = this.transactionService.periodEnd();
      const start = new Date(ps + 'T00:00');
      const end = new Date(pe + 'T23:59:59');
      const opTotals = this.transactionService.operatingAccountTotals();
      const openingOp = opTotals.reduce((s, a) => s + (Number.isFinite(a.initial) ? a.initial : 0), 0);
      const typeBy = this.transactionService.accountTypeByName();
      const excludeIds2 = this.transactionService.transferIds();
      const incomeTx = this.transactionService
        .transactions()
        .filter((t) => t.type === 'income' && typeBy.get(t.account) === 'OPERATIVA' && !excludeIds2.has(t.id) && t.category !== 'Transferencia interna' && (() => { const d = new Date(t.date + 'T00:00'); return d >= start && d <= end; })());
      const income = incomeTx.reduce((s, t) => s + t.amount, 0);
      const incomeByAccount = incomeTx.reduce((m, t) => { const k = t.account || 'General'; m[k]=(m[k]||0)+t.amount; return m; }, {} as Record<string,number>);
      const incomeByCategory = incomeTx.reduce((m, t) => { const k = t.category || 'General'; m[k]=(m[k]||0)+t.amount; return m; }, {} as Record<string,number>);
      const svMap = this.transactionService.monthlySavingsByKey();
      const savingsNet = Math.max(0, svMap[mk] || 0);
      const cap = Math.max(0, openingOp + income - savingsNet);
      const code = this.transactionService.currencyCode();
      const fmt = (v:number) => { try { return new Intl.NumberFormat('es-ES',{style:'currency',currency:code}).format(v||0); } catch { return (v||0).toFixed(2);} };
      // eslint-disable-next-line no-console
      console.groupCollapsed('%c[Presupuesto] Desglose del Tope planificable','color:#059669;font-weight:600');
      // eslint-disable-next-line no-console
      console.log('• Clave de mes:', mk);
      // eslint-disable-next-line no-console
      console.log('• Periodo de corte:', ps, '→', pe);
      // Saldos iniciales
      // eslint-disable-next-line no-console
      console.groupCollapsed('• Saldos iniciales (operativas):', fmt(openingOp));
      opTotals.forEach(a => {
        // eslint-disable-next-line no-console
        console.log(`   · ${a.account}:`, fmt(Number.isFinite(a.initial) ? a.initial : 0));
      });
      // eslint-disable-next-line no-console
      console.groupEnd();
      // eslint-disable-next-line no-console
      console.groupCollapsed('• Ingresos del periodo (operativas):', fmt(income));
      // Por cuenta
      // eslint-disable-next-line no-console
      console.groupCollapsed('   ◦ Por cuenta');
      Object.entries(incomeByAccount)
        .sort((a,b)=>b[1]-a[1])
        .forEach(([acc, val]) => {
          // eslint-disable-next-line no-console
          console.log(`     · ${acc}:`, fmt(val));
        });
      // eslint-disable-next-line no-console
      console.groupEnd();
      // Por categoría
      // eslint-disable-next-line no-console
      console.groupCollapsed('   ◦ Por categoría');
      Object.entries(incomeByCategory)
        .sort((a,b)=>b[1]-a[1])
        .forEach(([cat, val]) => {
          // eslint-disable-next-line no-console
          console.log(`     · ${cat}:`, fmt(val));
        });
      // eslint-disable-next-line no-console
      console.groupEnd();
      // eslint-disable-next-line no-console
      console.groupEnd();
      // eslint-disable-next-line no-console
      console.log('• Ahorro neto del periodo (depósitos netos a ahorro):', fmt(savingsNet));
      // eslint-disable-next-line no-console
      console.log('• Tope planificable = Inicial + Ingresos − Ahorro:', fmt(cap));
      // eslint-disable-next-line no-console
      console.groupEnd();
    } catch {}
  });

  readonly incomeThisMonth = computed(() => {
    const key = this.transactionService.currentMonthKey();
    let total = 0;
    for (const t of this.transactionService.transactions()) {
      if (t.type !== 'income') continue;
      const d = new Date(t.date + 'T00:00');
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (k === key) total += t.amount;
    }
    return total;
  });

  // Savings planning removed; fallback plannedSavings to 0
  readonly plannedSavingsThisMonth = computed(() => 0);

  readonly availableForExpenses = computed(() => Math.max(0, this.incomeThisMonth()));

  // Solo transacciones de gasto operativas (excluir ahorro/transferencias)
  readonly operatingExpenseTx = computed(() => {
    const typeBy = this.transactionService.accountTypeByName();
    return this.transactionService.transactions().filter(
      (t) => t.type === 'expense' && typeBy.get(t.account) === 'OPERATIVA' && t.category !== 'Transferencia interna'
    );
  });

  ngOnInit(): void {
    this.transactionService.ensureMonthLoaded();
    this.categoriesStore.load();
    // React to categories changes so dropdowns are populated even if load is async
    this.categoriesStore.items$.subscribe((list) => {
      const names = (list || []).map((c) => c.name);
      // Excluir la categoría de Ahorro de la planificación por categoría
      this.categoryNames = names
        .filter((n) => (n || '').trim().toLowerCase() !== 'ahorro')
        .sort((a, b) => a.localeCompare(b));
    });
    this.budgetSvc.ensureLoaded?.();
  }
}
