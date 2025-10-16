import { CommonModule } from '@angular/common';
import { PRIMENG_IMPORTS } from '../../shared/primeng';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-category-summary',
  standalone: true,
  imports: [CommonModule, ...PRIMENG_IMPORTS],
  templateUrl: './category-summary.component.html',
  styleUrl: './category-summary.component.css',
})
export class CategorySummaryComponent {
  @Input() expenseByCategory: { category: string; amount: number }[] = [];
  @Input() currencyCode!: string;

  showAll = false;

  get total(): number {
    return (this.expenseByCategory || []).reduce((a, b) => a + (b?.amount || 0), 0);
  }

  private get sorted(): { category: string; amount: number }[] {
    return [...(this.expenseByCategory || [])].sort((a, b) => (b?.amount || 0) - (a?.amount || 0));
  }

  get visible(): { category: string; amount: number }[] {
    const data = this.sorted;
    return this.showAll ? data : data.slice(0, 5);
  }

  percent(amount: number): number {
    const t = this.total || 1;
    return Math.round((amount / t) * 100);
  }
}