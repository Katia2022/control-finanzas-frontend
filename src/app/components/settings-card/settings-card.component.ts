import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SettingsService } from '../../services/settings.service';
import { PRIMENG_IMPORTS } from '../../shared/primeng';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-card',
  standalone: true,
  imports: [CommonModule, FormsModule, ...PRIMENG_IMPORTS],
  templateUrl: './settings-card.component.html',
  styleUrl: './settings-card.component.css',
})
export class SettingsCardComponent {
  readonly settingsSvc = inject(SettingsService);
}
