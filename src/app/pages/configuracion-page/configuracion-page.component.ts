import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsCardComponent } from '../../components/settings-card/settings-card.component';

@Component({
  selector: 'app-configuracion-page',
  standalone: true,
  imports: [CommonModule, SettingsCardComponent],
  templateUrl: './configuracion-page.component.html',
  styleUrl: './configuracion-page.component.css'
})
export class ConfiguracionPageComponent {}

