import { Pipe, PipeTransform } from '@angular/core';
import { AccountType } from '../../api/accounts.api';

@Pipe({ name: 'accountTypeLabel', standalone: true })
export class AccountTypeLabelPipe implements PipeTransform {
  transform(type: AccountType | null | undefined): string {
    if (type === 'OPERATIVA') return 'Operativa';
    if (type === 'AHORRO') return 'Ahorro';
    return '—';
  }
}

@Pipe({ name: 'accountTypeSeverity', standalone: true })
export class AccountTypeSeverityPipe implements PipeTransform {
  transform(type: AccountType | null | undefined): 'info' | 'success' | 'secondary' {
    if (type === 'OPERATIVA') return 'info';
    if (type === 'AHORRO') return 'success';
    return 'secondary';
  }
}

