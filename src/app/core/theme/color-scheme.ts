import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
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
  readonly selected = computed(
    () => `${this.palette()}-${this.dark() ? 'dark' : 'light'}`,
  );
  select(value: string): void {
    const option = this.palettes.find(
      (p) => value === `${p.key}-light` || value === `${p.key}-dark`,
    );
    if (!option) {
      return;
    }
    this.palette.set(option.key);
    this.dark.set(value.endsWith('-dark'));
    this.apply();
  }
  toggle(): void {
    this.dark.update((value) => !value);
    this.apply();
  }
  private apply(): void {
    this.document.documentElement.classList.toggle('app-dark', this.dark());
    this.document.documentElement.dataset['palette'] = this.palette();
  }
}
