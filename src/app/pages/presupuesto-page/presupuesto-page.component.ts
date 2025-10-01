import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetCardComponent } from '../../components/budget-card/budget-card.component';
import { TransactionsService } from '../../services/transactions.service';
import { CategoriesService } from '../../services/categories.service';

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
}

