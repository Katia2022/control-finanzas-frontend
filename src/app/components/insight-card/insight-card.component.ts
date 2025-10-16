import { CommonModule } from '@angular/common';
import { PRIMENG_IMPORTS } from '../../shared/primeng';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-insight-card',
  standalone: true,
  imports: [CommonModule, ...PRIMENG_IMPORTS],
  templateUrl: './insight-card.component.html',
  styleUrl: './insight-card.component.css',
})
export class InsightCardComponent {
  @Input() insight!: string;
  @Input() topMonthLabel: string | null = null;
  @Input() topExpenseCategory: string | null = null;
}
