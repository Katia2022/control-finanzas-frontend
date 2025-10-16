import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriesCardComponent } from '../../components/categories-card/categories-card.component';
import { TransactionsService } from '../../services/transactions.service';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [CommonModule, CategoriesCardComponent],
  templateUrl: './categories-page.component.html',
  styleUrl: './categories-page.component.css',
})
export class CategoriesPageComponent {
  readonly transactionService = inject(TransactionsService);
}
