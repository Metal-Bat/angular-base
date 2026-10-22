import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
export const themePalettes = [
  { key: 'blue', name: 'Blue' },
  { key: 'indigo', name: 'Indigo' },
  { key: 'violet', name: 'Violet' },
  { key: 'emerald', name: 'Emerald' },
  { key: 'teal', name: 'Teal' },
  { key: 'rose', name: 'Rose' },
  { key: 'amber', name: 'Amber' },
] as const;
export const themeStorageKey = 'workspace.public-theme';
export type ThemePalette = (typeof themePalettes)[number]['key'];
@Injectable({ providedIn: 'root' })
export class ColorScheme {
  private readonly document = inject(DOCUMENT);
  readonly palettes = themePalettes;
  readonly palette = signal<ThemePalette>('blue');
  readonly dark = signal(
    this.document.documentElement.classList.contains('app-dark'),
  );
  readonly mode = signal<'light' | 'dark' | 'system'>(
    this.dark() ? 'dark' : 'light',
  );
  private readonly media = this.document.defaultView?.matchMedia?.(
    '(prefers-color-scheme: dark)',
  );
  readonly systemAvailable = !!this.media;
  readonly selected = computed(
    () => `${this.palette()}-${this.dark() ? 'dark' : 'light'}`,
  );
  constructor() {
    this.restore();
    const changed = (): void => {
      if (this.mode() === 'system') {
        this.dark.set(this.media?.matches ?? false);
        this.apply();
      }
    };
    this.media?.addEventListener('change', changed);
    inject(DestroyRef).onDestroy(() => {
      this.media?.removeEventListener('change', changed);
    });
  }
  setMode(mode: 'light' | 'dark' | 'system'): void {
    if (
      !['light', 'dark', 'system'].includes(mode) ||
      (mode === 'system' && !this.systemAvailable)
    ) {
      return;
    }
    this.mode.set(mode);
    this.dark.set(
      mode === 'system' ? (this.media?.matches ?? false) : mode === 'dark',
    );
    this.apply();
  }
  select(value: string): void {
    const option = this.palettes.find(
      (p) => value === `${p.key}-light` || value === `${p.key}-dark`,
    );
    if (!option) {
      return;
    }
    this.palette.set(option.key);
    this.dark.set(value.endsWith('-dark'));
    this.mode.set(this.dark() ? 'dark' : 'light');
    this.apply();
  }
  private restore(): void {
    // Only a bounded, nonprivate appearance hint survives logout. Server preferences
    // remain authoritative after login; no actor identity or other settings are cached.
    try {
      const stored =
        this.document.defaultView?.localStorage.getItem(themeStorageKey);
      const [palette, mode] = (stored ?? '').split('-');
      if (
        stored === `${palette}-${mode}` &&
        this.palettes.some((item) => item.key === palette) &&
        ['light', 'dark', 'system'].includes(mode)
      ) {
        this.palette.set(palette as ThemePalette);
        this.setMode(mode as 'light' | 'dark' | 'system');
      }
    } catch {
      // Storage can be unavailable in private/restricted browser contexts.
    }
  }
  private apply(): void {
    this.document.documentElement.classList.toggle('app-dark', this.dark());
    this.document.documentElement.dataset['palette'] = this.palette();
    try {
      this.document.defaultView?.localStorage.setItem(
        themeStorageKey,
        `${this.palette()}-${this.mode()}`,
      );
    } catch {
      // Theme switching continues to work when browser storage is unavailable.
    }
  }
}
