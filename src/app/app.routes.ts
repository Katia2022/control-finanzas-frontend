import { Routes } from '@angular/router';
import { SummaryPageComponent } from './pages/summary-page/summary-page.component';
import { TransactionsPageComponent } from './pages/transactions-page/transactions-page.component';
import { CategoriesPageComponent } from './pages/categories-page/categories-page.component';
import { BudgetPageComponent } from './pages/budget-page/budget-page.component';
import { AccountsPageComponent } from './pages/accounts-page/accounts-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { SavingsPageComponent } from './pages/savings-page/savings-page.component';

export const routes: Routes = [
  { path: '', component: SummaryPageComponent },
  { path: 'movimientos', component: TransactionsPageComponent },
  { path: 'categorias', component: CategoriesPageComponent },
  { path: 'cuentas', component: AccountsPageComponent },
  { path: 'presupuesto', component: BudgetPageComponent },
  { path: 'ahorro', component: SavingsPageComponent },
  { path: 'configuracion', component: SettingsPageComponent },
  { path: '**', redirectTo: '' },
];
