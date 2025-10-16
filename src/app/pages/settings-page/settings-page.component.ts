import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsCardComponent } from '../../components/settings-card/settings-card.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, SettingsCardComponent],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css'
})
export class SettingsPageComponent {}
