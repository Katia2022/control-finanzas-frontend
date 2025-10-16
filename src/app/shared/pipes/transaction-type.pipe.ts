import { Pipe, PipeTransform } from '@angular/core';

export type TxType = 'income' | 'expense' | null | undefined;

@Pipe({ name: 'txTypeLabel', standalone: true })
export class TxTypeLabelPipe implements PipeTransform {
  transform(type: TxType): string {
    if (type === 'income') return 'Ingreso';
    if (type === 'expense') return 'Gasto';
    return '—';
  }
}

@Pipe({ name: 'txTypeSeverity', standalone: true })
export class TxTypeSeverityPipe implements PipeTransform {
  transform(type: TxType): 'success' | 'danger' | 'secondary' {
    if (type === 'income') return 'success';
    if (type === 'expense') return 'danger';
    return 'secondary';
  }
}

