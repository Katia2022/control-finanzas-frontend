import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AccountsApi } from '../../api/accounts.api';
import { SavingsApi, SavingsPlanView, PlanStatus, PlanType, SavingsMoveView } from '../../api/savings.api';
import { TransactionsApi } from '../../api/transactions.api';
import { TransactionsService } from '../../services/transactions.service';

@Component({
  selector: 'app-savings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './savings-page.component.html',
  styleUrl: './savings-page.component.css',
})
export class SavingsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly savingsApi = inject(SavingsApi);
  private readonly txApi = inject(TransactionsApi);
  private readonly accountsApi = inject(AccountsApi);
  readonly tx = inject(TransactionsService);

  readonly monthKey = computed(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Basic income for current month
  readonly incomeThisMonth = signal(0);

  readonly plannedThisMonth = computed(() => {
    const income = this.incomeThisMonth();
    let total = 0;
    for (const p of this.plans()) {
      if (p.type === 'FIXED') total += p.amountPlanned || 0;
      else total += Math.round(((p.percent || 0) * income) * 100) / 100;
    }
    return total;
  });

  readonly executedThisMonth = computed(() => this.moves().filter(m => m.status === 'DONE').reduce((a, b) => a + (b.amount || 0), 0));

  readonly availableForExpenses = computed(() => Math.max(0, this.incomeThisMonth() - this.plannedThisMonth()));

  readonly plans = signal<SavingsPlanView[]>([]);

  readonly moves = signal<SavingsMoveView[]>([]);

  readonly accounts = signal<string[]>([]);
  readonly accountsById = signal<Record<number, string>>({});
  readonly operativas = signal<{ id: number; name: string }[]>([]);
  readonly ahorro = signal<{ id: number; name: string }[]>([]);
  planName(id: number): string { return this.plans().find(x => x.id === id)?.name || '—'; }
  accountName(id?: number | null): string { return (id != null ? this.accountsById()[id] : undefined) || '—'; }

  // UX state
  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly infoMsg = signal<string | null>(null);

  readonly createForm = this.fb.group({
    name: this.fb.control('', { validators: [Validators.required, Validators.maxLength(40)] }),
    type: this.fb.control<'fixed' | 'percent'>('fixed', { validators: [Validators.required] }),
    amountPlanned: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    percent: this.fb.control<number | null>(null, { validators: [Validators.min(0), Validators.max(1)] }),
    priority: this.fb.control<number>(1, { validators: [Validators.min(1)] }),
    sourceAccountId: this.fb.control<number | null>(null),
    targetAccountId: this.fb.control<number | null>(null),
  });

  ngOnInit(): void {
    this.refreshAll();
  }

  private refreshAll() {
    const mk = this.monthKey();
    this.loading.set(true); this.errorMsg.set(null);
    this.savingsApi.listPlans(mk).subscribe({ next: pl => this.plans.set(pl || []), error: () => this.errorMsg.set('No se pudieron cargar los planes de ahorro.') });
    this.savingsApi.listMoves(mk).subscribe({ next: mv => this.moves.set(mv || []), error: () => this.errorMsg.set('No se pudieron cargar los movimientos de ahorro.') });
    this.accountsApi.list().subscribe({ next: accs => {
      const list = accs || [];
      this.accounts.set(list.map(a => a.name));
      const map: Record<number, string> = {};
      list.forEach(a => { if (a && typeof a.id === 'number') map[a.id] = a.name; });
      this.accountsById.set(map);
      this.operativas.set(list.filter((a: any) => a.type === 'OPERATIVA').map((a: any) => ({ id: a.id, name: a.name })));
      this.ahorro.set(list.filter((a: any) => a.type === 'AHORRO').map((a: any) => ({ id: a.id, name: a.name })));
    }, error: () => this.errorMsg.set('No se pudieron cargar las cuentas.') });
    this.txApi.list(mk).subscribe({ next: list => {
      const income = (list || []).filter(t => t.type === 'INCOME').reduce((a, b) => a + (b.amount || 0), 0);
      this.incomeThisMonth.set(income);
      this.loading.set(false);
    }, error: () => { this.errorMsg.set('No se pudieron cargar los ingresos del mes.'); this.loading.set(false); } });
  }

  addPlan() {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    const raw = this.createForm.getRawValue();
    const body: any = {
      name: (raw.name ?? '').toString(),
      monthKey: this.monthKey(),
      type: (raw.type === 'percent' ? 'PERCENT' : 'FIXED') as PlanType,
      amountPlanned: Number(raw.amountPlanned || 0),
      percent: raw.type === 'percent' ? Number(raw.percent || 0) : undefined,
      priority: Number(raw.priority ?? 1),
      status: 'ACTIVE' as PlanStatus,
      sourceAccountId: (raw as any).sourceAccountId ?? undefined,
      targetAccountId: (raw as any).targetAccountId ?? undefined,
    };
    this.loading.set(true);
    this.savingsApi.createPlan(body).subscribe({
      next: () => { this.infoMsg.set('Plan creado.'); this.refreshAll(); },
      error: (err) => { this.loading.set(false); this.errorMsg.set(err?.error?.title || 'No se pudo crear el plan.'); }
    });
    this.createForm.reset({ name: '', type: 'fixed', amountPlanned: null, percent: null, priority: 1, sourceAccountId: null, targetAccountId: null });
  }

  removePlan(id: number) { this.loading.set(true); this.savingsApi.deletePlan(id).subscribe({ next: () => { this.infoMsg.set('Plan eliminado.'); this.refreshAll(); }, error: () => { this.loading.set(false); this.errorMsg.set('No se pudo eliminar el plan.'); } }); }
  pausePlan(id: number) { this.loading.set(true); this.savingsApi.updatePlan(id, { status: 'PAUSED' }).subscribe({ next: () => { this.infoMsg.set('Plan pausado.'); this.refreshAll(); }, error: () => { this.loading.set(false); this.errorMsg.set('No se pudo pausar el plan.'); } }); }
  resumePlan(id: number) { this.loading.set(true); this.savingsApi.updatePlan(id, { status: 'ACTIVE' }).subscribe({ next: () => { this.infoMsg.set('Plan reanudado.'); this.refreshAll(); }, error: () => { this.loading.set(false); this.errorMsg.set('No se pudo reanudar el plan.'); } }); }

  scheduleMoves() { this.loading.set(true); this.savingsApi.scheduleMoves(this.monthKey(), this.incomeThisMonth()).subscribe({ next: () => { this.infoMsg.set('Movimientos generados.'); this.refreshAll(); }, error: () => { this.loading.set(false); this.errorMsg.set('No se pudieron generar los movimientos.'); } }); }

  markDone(id: number) { this.loading.set(true); this.savingsApi.markMoveDone(id).subscribe({ next: () => { this.infoMsg.set('Movimiento ejecutado.'); this.refreshAll(); }, error: (err) => { this.loading.set(false); this.errorMsg.set(err?.error?.title || 'No se pudo ejecutar el movimiento.'); } }); }
}
