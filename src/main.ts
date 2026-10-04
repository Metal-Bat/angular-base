import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import {
  loadRuntimeConfig,
  RUNTIME_CONFIG,
} from './app/core/configuration/runtime-config';

async function start(): Promise<void> {
  const config = await loadRuntimeConfig();
  document.documentElement.lang = config.locale;
  document.documentElement.dir = config.locale === 'fa' ? 'rtl' : 'ltr';
  await bootstrapApplication(App, {
    ...appConfig,
    providers: [
      ...appConfig.providers,
      { provide: RUNTIME_CONFIG, useValue: config },
    ],
  });
}

start().catch(() => {
  const root = document.querySelector('app-root');
  if (root) {
    root.textContent =
      'The workspace could not start. Please reload or contact support.';
  }
});
