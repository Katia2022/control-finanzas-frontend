import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-hero-balance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-balance.component.html',
  styleUrl: './hero-balance.component.css',
})
export class HeroBalanceComponent {
  @Input() balance!: number;
  @Input() totalIncome!: number;
  @Input() totalExpense!: number;
  @Input() savingsRate!: number;
  @Input() currencyCode!: string;
}
