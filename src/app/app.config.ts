import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { MessageService } from 'primeng/api';
import { httpToastInterceptor } from './core/http-toast.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideAnimations(),
    provideHttpClient(withInterceptors([httpToastInterceptor])),
    // Force light scheme and disable auto dark based on prefers-color-scheme
    providePrimeNG({ theme: { preset: Aura, options: { colorScheme: 'light', darkModeSelector: 'html.app-dark' } }, ripple: true }),
    MessageService,
    { provide: LOCALE_ID, useValue: 'es-ES' },
  ]
};
