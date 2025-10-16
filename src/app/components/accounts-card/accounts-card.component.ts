import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { PRIMENG_IMPORTS } from '../../shared/primeng';
import { AccountTypeLabelPipe, AccountTypeSeverityPipe } from '../../shared/pipes/account-type.pipe';
import { AccountsService } from '../../services/accounts.service';
import { AccountsApi, AccountType, AccountView } from '../../api/accounts.api';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-accounts-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ...PRIMENG_IMPORTS, AccountTypeLabelPipe, AccountTypeSeverityPipe],
  templateUrl: './accounts-card.component.html',
  styleUrl: './accounts-card.component.css',
})
export class AccountsCardComponent implements OnInit {
  private readonly accountsSvc = inject(AccountsService);
  private readonly accountsApi = inject(AccountsApi);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(MessageService);
  readonly accounts = this.accountsSvc.accounts;
  addError = signal<string | null>(null);
  serverAccounts = signal<AccountView[]>([]);
  readonly infoMsg = this.accountsSvc.lastInfo;
  readonly errorMsg = this.accountsSvc.lastError;

  private readonly accountsLower = computed(() => this.accounts().map(a => a.toLocaleLowerCase()));

  // Table rows enriched for PrimeNG p-table (avoid arrow functions in template)
  readonly rows = computed(() => this.accounts().map(a => ({
    name: a,
    type: this.typeOf(a),
    initial: this.initialOf(a),
  })));

  // UI state
  newAccCtrl = this.fb.control('', { validators: [Validators.required, Validators.maxLength(40)] });
  newAccType = this.fb.control<AccountType>('OPERATIVA', { nonNullable: true });
  editing = signal<string | null>(null);
  editCtrl = this.fb.control('', { validators: [Validators.required, Validators.maxLength(40)] });

  // Toast notifications from AccountsService signals
  readonly toastFx = effect(() => {
    const err = this.errorMsg();
    const info = this.infoMsg();
    if (err) this.msg.add({ severity: 'error', summary: 'Cuentas', detail: err, life: 3000 });
    if (info) this.msg.add({ severity: 'success', summary: 'Cuentas', detail: info, life: 2000 });
  });

  ngOnInit(): void {
    // Ensure cached state for listing
    this.accountsSvc.ensureLoaded?.();
    this.refreshFromServer();
  }

  private refreshFromServer() {
    // Hydrate from backend (best-effort). If it fails, keep local state.
    this.accountsApi.list().subscribe({
      next: (list) => {
        this.serverAccounts.set(list);
        for (const a of list) {
          this.accountsSvc.ensure(a.name);
          if (typeof a.initialBalance === 'number') {
            this.accountsSvc.setInitial(a.name, a.initialBalance);
          }
        }
      },
      error: () => {
        // Silent fallback to local data
      },
    });
  }

  add() {
    if (this.newAccCtrl.invalid) { this.newAccCtrl.markAsTouched(); return; }
    const v = (this.newAccCtrl.value ?? '').toString().trim();
    if (!v) { this.newAccCtrl.markAsTouched(); return; }
    // Prevent duplicates (case-insensitive)
    if (this.accountsLower().includes(v.toLocaleLowerCase())) {
      this.addError.set('La cuenta ya existe.');
      return;
    }
    // Try server first; fall back to local on error
    this.accountsApi.create({ name: v, type: this.newAccType.value ?? 'OPERATIVA' }).subscribe({
      next: (created) => {
        // Sync list from server to ensure consistency
        this.refreshFromServer();
        this.newAccCtrl.reset('');
        this.newAccType.setValue('OPERATIVA');
        this.addError.set(null);
      },
      error: (err) => {
        if (err?.status === 409) {
          this.addError.set('La cuenta ya existe en el servidor.');
        } else {
          this.addError.set('No se pudo guardar en el servidor.');
        }
      },
    });
  }

  startEdit(name: string) {
    this.editing.set(name);
    this.editCtrl.reset(name);
  }

  saveEdit() {
    const prev = this.editing();
    if (this.editCtrl.invalid) { this.editCtrl.markAsTouched(); return; }
    const val = (this.editCtrl.value ?? '').toString().trim();
    if (prev && val) {
      this.accountsSvc.rename(prev, val);
    }
    this.cancelEdit();
    this.refreshFromServer();
  }

  cancelEdit() {
    this.editing.set(null);
    this.editCtrl.reset('');
  }

  remove(name: string) {
    this.accountsSvc.remove(name);
  //  this.refreshFromServer();
  }

  initialOf(name: string): number { return this.accountsSvc.getInitial(name); }
  updateInitial(name: string, value: number | null) {
    if (value == null || !Number.isFinite(value)) return;
    this.accountsSvc.setInitial(name, Number(value));
  }

  typeOf(name: string): AccountType | null {
    const acc = this.serverAccounts().find(a => a.name === name);
    return acc?.type ?? null;
  }
}
