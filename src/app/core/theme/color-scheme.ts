import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { ActorState } from '../auth/actor-state';
export const themePalettes = [
  { key: 'blue', name: 'Blue' },
  { key: 'indigo', name: 'Indigo' },
  { key: 'violet', name: 'Violet' },
  { key: 'emerald', name: 'Emerald' },
  { key: 'teal', name: 'Teal' },
  { key: 'rose', name: 'Rose' },
  { key: 'amber', name: 'Amber' },
] as const;
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
    const release = inject(ActorState).register(() => this.reset());
    const changed = (): void => {
      if (this.mode() === 'system') {
        this.dark.set(this.media?.matches ?? false);
        this.apply();
      }
    };
    this.media?.addEventListener('change', changed);
    inject(DestroyRef).onDestroy(() => {
      release();
      this.media?.removeEventListener('change', changed);
    });
  }
  reset(): void {
    this.palette.set('blue');
    this.setMode('light');
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
  toggle(): void {
    this.dark.update((value) => !value);
    this.mode.set(this.dark() ? 'dark' : 'light');
    this.apply();
  }
  private apply(): void {
    this.document.documentElement.classList.toggle('app-dark', this.dark());
    this.document.documentElement.dataset['palette'] = this.palette();
  }
}
