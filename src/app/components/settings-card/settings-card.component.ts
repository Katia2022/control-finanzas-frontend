import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-settings-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-card.component.html',
  styleUrl: './settings-card.component.css',
})
export class SettingsCardComponent {
  private readonly settingsSvc = inject(SettingsService);
  readonly savingsMinRate = computed(() => this.settingsSvc.settings().savingsMinRate);
  readonly currencyCode = computed(() => this.settingsSvc.settings().currencyCode);

  // local UI value in percent for inputs
  percent = computed(() => Math.round(this.savingsMinRate() * 100));

  onPercentChange(value: number) {
    if (Number.isFinite(value)) {
      this.settingsSvc.setSavingsMinRate(value / 100);
    }
  }

  onCurrencyChange(code: 'MXN' | 'USD' | 'EUR') {
    this.settingsSvc.setCurrency(code);
  }
}
