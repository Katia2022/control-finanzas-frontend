// Centralized PrimeNG imports for standalone components.
// Import this array in a component: imports: [CommonModule, ...PRIMENG_IMPORTS]
// Note: Importing many modules globally can increase bundle size.

import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { PanelModule } from 'primeng/panel';
import { ToolbarModule } from 'primeng/toolbar';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProgressBarModule } from 'primeng/progressbar';
import { AccordionModule } from 'primeng/accordion';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

export const PRIMENG_IMPORTS = [
  ButtonModule,
  ToastModule,
  InputTextModule,
  IconFieldModule,
  InputIconModule,
  SelectModule,
  DialogModule,
  TableModule,
  CardModule,
  TooltipModule,
  TagModule,
  BadgeModule,
  ChipModule,
  PanelModule,
  ToolbarModule,
  DividerModule,
  ConfirmDialogModule,
  InputNumberModule,
  DatePickerModule,
  CheckboxModule,
  RadioButtonModule,
  ProgressSpinnerModule,
  ProgressBarModule,
  AccordionModule,
] as const;
