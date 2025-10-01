import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriesCardComponent } from '../../components/categories-card/categories-card.component';
import { TransactionsService } from '../../services/transactions.service';

@Component({
  selector: 'app-categorias-page',
  standalone: true,
  imports: [CommonModule, CategoriesCardComponent],
  templateUrl: './categorias-page.component.html',
  styleUrl: './categorias-page.component.css'
})
export class CategoriasPageComponent {
  readonly tx = inject(TransactionsService);
}

