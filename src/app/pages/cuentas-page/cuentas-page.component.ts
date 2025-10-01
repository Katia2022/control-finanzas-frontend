import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountsCardComponent } from '../../components/accounts-card/accounts-card.component';
import { TransactionsService } from '../../services/transactions.service';

@Component({
  selector: 'app-cuentas-page',
  standalone: true,
  imports: [CommonModule, AccountsCardComponent],
  templateUrl: './cuentas-page.component.html',
  styleUrl: './cuentas-page.component.css'
})
export class CuentasPageComponent {
  readonly tx = inject(TransactionsService);
}

