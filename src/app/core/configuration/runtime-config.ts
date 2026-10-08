import { isSupportedLocale, SupportedLocale } from '../localization/languages';
import { implementedRendererCapabilities } from '../../contracts/renderer-capabilities';
import { InjectionToken } from '@angular/core';

export type RuntimeConfig = {
  readonly apiBasePath: '/api/v1';
  readonly sessionBasePath: '/session';
  readonly locale: SupportedLocale;
  readonly rendererCapabilities: readonly string[];
};

export const defaultRuntimeConfig: RuntimeConfig = {
  apiBasePath: '/api/v1',
  sessionBasePath: '/session',
  locale: 'en',
  rendererCapabilities: implementedRendererCapabilities,
};

export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>(
  'Runtime configuration',
  {
    providedIn: 'root',
    factory: (): RuntimeConfig => defaultRuntimeConfig,
  },
);

// Public configuration is allowlisted. Client secrets and trusted release identity live on the server.
export function readRuntimeConfig(value: unknown): RuntimeConfig {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Invalid runtime configuration.');
  }
  const config = value as Record<string, unknown>;
  const keys = [
    'apiBasePath',
    'sessionBasePath',
    'locale',
    'rendererCapabilities',
  ];
  if (
    Object.keys(config).some((key) => !keys.includes(key)) ||
    config['apiBasePath'] !== '/api/v1' ||
    config['sessionBasePath'] !== '/session' ||
    !isSupportedLocale(String(config['locale'])) ||
    !Array.isArray(config['rendererCapabilities']) ||
    config['rendererCapabilities'].length > 32 ||
    !config['rendererCapabilities'].every(
      (entry: unknown) =>
        typeof entry === 'string' &&
        /^[a-z][a-z0-9._-]*\/[1-9][0-9]*$/.test(entry) &&
        implementedRendererCapabilities.includes(entry),
    )
  ) {
    throw new Error('Invalid runtime configuration.');
  }
  return Object.freeze({
    apiBasePath: '/api/v1',
    sessionBasePath: '/session',
    locale: config['locale'] as SupportedLocale,
    rendererCapabilities: Object.freeze([
      ...config['rendererCapabilities'],
    ] as string[]),
  });
}

export async function loadRuntimeConfig(
  fetcher: typeof fetch = fetch,
): Promise<RuntimeConfig> {
  const response = await fetcher('/runtime-config.json', {
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (!response.ok) {
    throw new Error('Runtime configuration is unavailable.');
  }
  return readRuntimeConfig(await response.json());
}
