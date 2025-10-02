import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MigrationService } from './services/migration.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // Run one-time local -> backend migration at startup
  private readonly migrator = inject(MigrationService);
  constructor() { this.migrator.migrateIfNeeded(); }
}
