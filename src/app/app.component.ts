import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MigrationService } from './services/migration.service';
import { ToastModule } from 'primeng/toast';
import { MenubarModule } from 'primeng/menubar';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterModule, ToastModule, MenubarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  // Run one-time local -> backend migration at startup
  private readonly migrator = inject(MigrationService);
  private readonly router = inject(Router);
  menuItems: MenuItem[] = [
    { label: 'Resumen', icon: 'pi pi-home', routerLink: ['/'], routerLinkActiveOptions: { exact: true } },
    { label: 'Movimientos', icon: 'pi pi-list', routerLink: ['/movimientos'] },
    { label: 'Presupuesto', icon: 'pi pi-chart-bar', routerLink: ['/presupuesto'] },
    { label: 'Ahorro', icon: 'pi pi-wallet', routerLink: ['/ahorro'] },
    { label: 'Categorías', icon: 'pi pi-star', routerLink: ['/categorias'] },
    { label: 'Cuentas', icon: 'pi pi-credit-card', routerLink: ['/cuentas'] },
    { label: 'Configuración', icon: 'pi pi-cog', routerLink: ['/configuracion'] },
  ];
  constructor() { this.migrator.migrateIfNeeded(); }

  ngOnInit() {
    // Initialize active state based on current URL and keep it on navigation
    const setActive = (url: string) => this.updateActiveMenu(url);
    setActive(this.router.url || '/');
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(e => {
      setActive(e.urlAfterRedirects || e.url);
    });
  }

  private updateActiveMenu(url: string) {
    const clean = (u: string) => u.split('?')[0].split('#')[0];
    const current = clean(url || '/');
    const startsWith = (p: string) => (current === '/' && p === '/') || (p !== '/' && current.startsWith(p));
    this.menuItems = this.menuItems.map((it) => {
      const link = Array.isArray(it.routerLink) ? it.routerLink.join('/') : (it.routerLink as string | undefined);
      const path = link ? (typeof link === 'string' ? link : `/${link}`) : '';
      const isExact = path === '/';
      const active = isExact ? current === '/' : (path && startsWith(path));
      return { ...it, styleClass: active ? 'is-active' : undefined } as MenuItem;
    });
  }
}
