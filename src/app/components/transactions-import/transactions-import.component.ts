import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PRIMENG_IMPORTS } from '../../shared/primeng';
import * as XLSX from 'xlsx';
import { MessageService } from 'primeng/api';

type TxType = 'income' | 'expense';

interface ParsedRow {
  type: TxType;
  date: string; // yyyy-MM-dd
  category: string;
  account: string;
  description?: string;
  amount: number;
}

@Component({
  selector: 'app-transactions-import',
  standalone: true,
  imports: [CommonModule, FormsModule, ...PRIMENG_IMPORTS],
  templateUrl: './transactions-import.component.html',
  styleUrl: './transactions-import.component.css',
})
export class TransactionsImportComponent {
  @Output() importRows = new EventEmitter<ParsedRow[]>();
  @Input() accounts: string[] = [];
  @Input() categories: string[] = [];

  selectedAccount = signal<string>('');
  accountModel = '';
  defaultCategory = signal<string>('');
  categoryModel = '';

  parsing = signal(false);
  error = signal<string | null>(null);
  parsed = signal<ParsedRow[]>([]);

  readonly parsedPreview = computed(() => this.parsed().slice(0, 20));
  readonly canImport = computed(() => !!this.selectedAccount().trim() && this.parsed().length > 0 && !this.parsing());
  private readonly msg = inject(MessageService);

  get accountOptions() { return (this.accounts || []).map(a => ({ label: a, value: a })); }
  get categoryOptions() { return (this.categories || []).map(c => ({ label: c, value: c })); }

  onFileChange(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    this.error.set(null);
    this.parsed.set([]);
    if (!file) return;

    const name = (file.name || '').toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      this.readXlsx(file);
      return;
    }
    if (!(name.endsWith('.csv') || name.endsWith('.txt'))) {
      this.error.set('Formato no soportado. Sube un archivo CSV.');
      input.value = '';
      return;
    }

    this.parsing.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = (reader.result || '').toString();
        const rows = this.parseCsv(text);
        this.parsed.set(rows);
        if (rows.length) {
          this.msg.add({ severity: 'info', summary: 'Importación', detail: `${rows.length} filas listas para importar.`, life: 2000 });
        }
      } catch (e) {
        this.error.set('No se pudo leer el CSV. Verifica el formato.');
        this.msg.add({ severity: 'error', summary: 'Importación', detail: 'No se pudo leer el CSV.', life: 3000 });
      } finally {
        this.parsing.set(false);
      }
    };
    reader.onerror = () => {
      this.error.set('Error al leer el archivo.');
      this.msg.add({ severity: 'error', summary: 'Importación', detail: 'Error al leer el archivo.', life: 3000 });
      this.parsing.set(false);
    };
    reader.readAsText(file, 'utf-8');
  }

  private parseCsv(text: string): ParsedRow[] {
    // Detect delimiter: semicolon if appears more than commas
    const lines = text.split(/\r?\n/).filter(l => l.trim().length);
    if (!lines.length) return [];
    const first = lines[0];
    const semi = (first.match(/;/g) || []).length;
    const comma = (first.match(/,/g) || []).length;
    const delim = semi > comma ? ';' : ',';

    // Very small CSV parser (no quoted multi-line). Suitable for simple exports.
    const parseLine = (l: string) => l.split(delim).map(x => x.trim().replace(/^"|"$/g, ''));
    const header = parseLine(first).map(h => h.toLowerCase());

    const col = (names: string[]) => {
      for (const n of names) {
        const i = header.indexOf(n);
        if (i !== -1) return i;
      }
      return -1;
    };

    const idx = {
      date: col(['fecha','date']),
      type: col(['tipo','type']),
      category: col(['categoria','categoría','category']),
      account: col(['cuenta','account']),
      description: col(['descripcion','descripción','description']),
      amount: col(['monto','importe','amount','valor']),
    } as const;

    const out: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = parseLine(lines[i]);
      if (!parts.length) continue;
      const rawType = (parts[idx.type] || '').toString().toLowerCase();
      const type: TxType = rawType.startsWith('ing') || rawType === 'income' ? 'income' : 'expense';
      const dateRaw = (parts[idx.date] || '').toString();
      const date = this.normalizeDate(dateRaw);
      const categoryRaw = (parts[idx.category] || '').toString().trim();
      const defaultCat = this.defaultCategory().trim();
      const category = categoryRaw || defaultCat;
      const accountFromFile = (parts[idx.account] || '').toString().trim();
      const account = (this.selectedAccount().trim() || accountFromFile);
      const description = (parts[idx.description] || '').toString().trim();
      const amount = this.parseAmount(parts[idx.amount]);
      if (!date || !account || !Number.isFinite(amount) || amount === 0) continue;
      // Infer type by sign if column Type missing or ambiguous
      const inferredType: TxType = amount >= 0 ? 'income' : 'expense';
      const finalType: TxType = (idx.type === -1 ? inferredType : type);
      const finalAmount = Math.abs(amount);
      out.push({ type: finalType, date, category, account, description: description || undefined, amount: finalAmount });
    }
    return out;
  }

  private readXlsx(file: File) {
    this.parsing.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
        const parsed = this.parseXlsxRows(rows);
        this.parsed.set(parsed);
        this.error.set(null);
        if (parsed.length) {
          this.msg.add({ severity: 'info', summary: 'Importación', detail: `${parsed.length} filas listas para importar.`, life: 2000 });
        }
      } catch (e) {
        this.error.set('No se pudo leer el Excel. Verifica el formato.');
        this.msg.add({ severity: 'error', summary: 'Importación', detail: 'No se pudo leer el Excel.', life: 3000 });
      } finally {
        this.parsing.set(false);
      }
    };
    reader.onerror = () => {
      this.error.set('Error al leer el archivo.');
      this.msg.add({ severity: 'error', summary: 'Importación', detail: 'Error al leer el archivo.', life: 3000 });
      this.parsing.set(false);
    };
    reader.readAsArrayBuffer(file);
  }

  private parseXlsxRows(rows: any[][]): ParsedRow[] {
    if (!rows.length) return [];
    // Buscar cabecera en primeras 20 filas: debe contener Descrição y Valor y alguna Data
    let headerRow = -1;
    let header: string[] = [];
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const r = (rows[i] || []).map((c) => (c ?? '').toString().trim());
      const lower = r.map((x) => x.toLowerCase());
      if ((lower.some(x => x.startsWith('descr')) || lower.includes('descrição')) && lower.includes('valor') && lower.some(x => x.startsWith('data'))) {
        headerRow = i;
        header = lower;
        break;
      }
    }
    if (headerRow === -1) return [];

    const col = (names: string[]) => {
      for (const n of names) {
        const idx = header.findIndex(h => h === n || h.startsWith(n));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const idx = {
      dateLanc: col(['data lanc.', 'data lanc', 'data lançamento', 'data lancamento']),
      dateValor: col(['data valor']),
      desc: col(['descrição', 'descricao', 'descri', 'descr']),
      valor: col(['valor'])
    } as const;

    const out: ParsedRow[] = [];
    for (let i = headerRow + 1; i < rows.length; i++) {
      const r = rows[i] || [];
      if (!r.length || r.every((c) => c == null || String(c).trim() === '')) continue;
      const dateCell = r[idx.dateValor] ?? r[idx.dateLanc];
      const date = this.normalizeXlsxDate(dateCell);
      const description = (r[idx.desc] ?? '').toString().trim();
      const amountCell = r[idx.valor];
      const amountNum = this.parseXlsxAmount(amountCell);
      if (!date || !Number.isFinite(amountNum) || amountNum === 0) continue;
      const inferredType: TxType = amountNum >= 0 ? 'income' : 'expense';
      const finalAmount = Math.abs(amountNum);
      const account = this.selectedAccount().trim();
      const category = this.defaultCategory().trim();
      out.push({ type: inferredType, date, category, account, description: description || undefined, amount: finalAmount });
    }
    return out;
  }

  private normalizeXlsxDate(v: any): string {
    if (v == null) return '';
    // Excel serial numbers become numbers; strings may be dd/MM/yyyy
    if (typeof v === 'number') {
      try {
        const d = XLSX.SSF.parse_date_code(v);
        if (d && Number.isFinite(d.y) && Number.isFinite(d.m) && Number.isFinite(d.d)) {
          const y = d.y;
          const m = String(d.m).padStart(2, '0');
          const day = String(d.d).padStart(2, '0');
          return `${y}-${m}-${day}`;
        }
      } catch {}
    }
    const s = v.toString();
    return this.normalizeDate(s);
  }

  private parseXlsxAmount(v: any): number {
    if (typeof v === 'number') return v;
    const s = (v ?? '').toString().trim();
    if (!s) return NaN;
    // In these files: comma decimal, dot thousand. Remove thousands and unify decimal.
    const normalized = s.replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9\.-]/g, '');
    return Number(normalized);
  }

  private normalizeDate(s: string): string {
    // Accept yyyy-MM-dd, dd/MM/yyyy, dd-MM-yyyy
    const t = s.trim();
    if (!t) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    const m = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      const d = m[1].padStart(2, '0');
      const mo = m[2].padStart(2, '0');
      const y = m[3].length === 2 ? `20${m[3]}` : m[3];
      return `${y}-${mo}-${d}`;
    }
    return t.slice(0, 10);
  }

  private parseAmount(val: unknown): number {
    if (typeof val === 'number') return val;
    const s = (val ?? '').toString().trim();
    if (!s) return NaN;
    // Handle common locales: remove thousands, unify decimal
    const normalized = s
      .replace(/\s/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '') // dots as thousand
      .replace(/,(?=\d{3}(\D|$))/g, '') // commas as thousand
      .replace(/,/g, '.')
      .replace(/[^0-9\.-]/g, '');
    return Number(normalized);
  }

  startImport() {
    const rows = this.parsed();
    if (!rows.length || !this.selectedAccount().trim()) return;
    this.importRows.emit(rows);
    this.msg.add({ severity: 'success', summary: 'Importación', detail: `Importando ${rows.length} filas…`, life: 1500 });
  }
}
