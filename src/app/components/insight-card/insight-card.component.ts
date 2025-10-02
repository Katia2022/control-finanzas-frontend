import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-insight-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insight-card.component.html',
  styleUrl: './insight-card.component.css',
})
export class InsightCardComponent {
  @Input() insight!: string;
  @Input() topMonthLabel: string | null = null;
  @Input() topExpenseCategory: string | null = null;
}
