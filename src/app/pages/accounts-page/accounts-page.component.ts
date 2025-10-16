import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountsCardComponent } from '../../components/accounts-card/accounts-card.component';
import { TransactionsService } from '../../services/transactions.service';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [CommonModule, AccountsCardComponent],
  templateUrl: './accounts-page.component.html',
  styleUrl: './accounts-page.component.css',
})
export class AccountsPageComponent {
  readonly transactionService = inject(TransactionsService);
}
