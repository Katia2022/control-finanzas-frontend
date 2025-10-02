import { Routes } from '@angular/router';
import { ResumenPageComponent } from './pages/resumen-page/resumen-page.component';
import { MovimientosPageComponent } from './pages/movimientos-page/movimientos-page.component';
import { CategoriasPageComponent } from './pages/categorias-page/categorias-page.component';
import { PresupuestoPageComponent } from './pages/presupuesto-page/presupuesto-page.component';
import { CuentasPageComponent } from './pages/cuentas-page/cuentas-page.component';
import { ConfiguracionPageComponent } from './pages/configuracion-page/configuracion-page.component';
import { SavingsPageComponent } from './pages/ahorro-page/savings-page.component';

export const routes: Routes = [
  { path: '', component: ResumenPageComponent },
  { path: 'movimientos', component: MovimientosPageComponent },
  { path: 'categorias', component: CategoriasPageComponent },
  { path: 'cuentas', component: CuentasPageComponent },
  { path: 'presupuesto', component: PresupuestoPageComponent },
  { path: 'ahorro', component: SavingsPageComponent },
  { path: 'configuracion', component: ConfiguracionPageComponent },
  { path: '**', redirectTo: '' },
];
