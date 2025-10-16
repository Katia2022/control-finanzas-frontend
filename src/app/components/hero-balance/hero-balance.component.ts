import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-hero-balance',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule],
  templateUrl: './hero-balance.component.html',
  styleUrl: './hero-balance.component.css',
  providers: [MessageService],
})
export class HeroBalanceComponent {
  @Input() balance!: number;
  @Input() totalIncome!: number;
  @Input() totalExpense!: number;
  @Input() totalSavings!: number;
  @Input() savingsRate!: number;
  @Input() currencyCode!: string;
  @Input() periodStart?: string | null;
  @Input() periodEnd?: string | null;
  @Input() loading?: boolean = false;
  @Input() error?: string | null = null;

  constructor(private messageService: MessageService) {}

  showSavingsTip() {
    this.messageService.add({
      severity: 'info',
      summary: 'Consejo de ahorro',
      detail: 'Reserva al menos el 10% de tus ingresos este mes.',
      life: 3000,
    });
  }
}
