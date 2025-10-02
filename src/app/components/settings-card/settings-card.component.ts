import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-settings-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-card.component.html',
  styleUrl: './settings-card.component.css',
})
export class SettingsCardComponent {
  readonly settingsSvc = inject(SettingsService);
}
