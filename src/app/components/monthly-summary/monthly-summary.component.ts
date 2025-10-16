import { CommonModule } from '@angular/common';
import { PRIMENG_IMPORTS } from '../../shared/primeng';
import { Component, Input, computed, inject } from '@angular/core';
import { SettingsService } from '../../services/settings.service';

interface MonthlySummary {
  key: string;
  label: string;
  income: number;
  expense: number;
}

@Component({
  selector: 'app-monthly-summary',
  standalone: true,
  imports: [CommonModule, ...PRIMENG_IMPORTS],
  templateUrl: './monthly-summary.component.html',
  styleUrl: './monthly-summary.component.css',
})
export class MonthlySummaryComponent {
  @Input() monthlySummaries: MonthlySummary[] = [];
  @Input() expenseByCategory: { category: string; amount: number }[] = [];
  @Input() currencyCode!: string;
  @Input() monthlySavingsByKey?: Record<string, number>;

  private readonly settings = inject(SettingsService);

  rangeFor(key: string): { start: string; end: string } {
    // key: yyyy-MM refers to the END month for the cutoff period
    const cutoff = Math.min(Math.max(this.settings.settings().monthCutoffDay || 1, 1), 31);
    const [y, m] = key.split('-').map((n) => Number(n));
    if (cutoff <= 1) {
      const endDay = new Date(y, m, 0).getDate();
      return {
        start: `${y}-${String(m).padStart(2, '0')}-01`,
        end: `${y}-${String(m).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
      };
    }
    let py = y;
    let pm = m - 1;
    if (pm <= 0) {
      pm = 12;
      py -= 1;
    }
    const prevLen = new Date(py, pm, 0).getDate();
    const startDay = Math.min(cutoff, prevLen);
    const currLen = new Date(y, m, 0).getDate();
    const endDay = Math.min(cutoff, currLen) - 1;
    const safeEnd = endDay <= 0 ? 1 : endDay;
    return {
      start: `${py}-${String(pm).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
      end: `${y}-${String(m).padStart(2, '0')}-${String(safeEnd).padStart(2, '0')}`,
    };
  }
}
