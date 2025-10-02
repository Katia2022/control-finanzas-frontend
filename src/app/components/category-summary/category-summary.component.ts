import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-category-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-summary.component.html',
  styleUrl: './category-summary.component.css',
})
export class CategorySummaryComponent {
  @Input() expenseByCategory: { category: string; amount: number }[] = [];
  @Input() currencyCode!: string;
}

