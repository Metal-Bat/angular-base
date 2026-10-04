import { Locale } from './core/localization/locale';
import {
  provideHttpClient,
  withInterceptors,
  withNoXsrfProtection,
} from '@angular/common/http';
import { AuthSession } from './core/auth/auth-session';
import { sessionInterceptor } from './core/auth/session-interceptor';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { PrimeNG, providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([sessionInterceptor]),
      withNoXsrfProtection(),
    ),
    provideAppInitializer(() => inject(AuthSession).bootstrap()),
    provideAppInitializer(() => inject(Locale).initialize()),
    providePrimeNG({}),
    provideAppInitializer(() => {
      const prime = inject(PrimeNG);
      return import('./core/theme/workspace-preset').then(
        ({ workspacePreset }): void => {
          prime.setThemeConfig({
            theme: {
              preset: workspacePreset,
              options: {
                darkModeSelector: '.app-dark',
                cssLayer: {
                  name: 'primeng',
                  order: 'theme, base, primeng, components, utilities',
                },
              },
            },
          });
        },
      );
    }),
  ],
};
