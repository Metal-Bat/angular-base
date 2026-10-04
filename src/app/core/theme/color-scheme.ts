import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ColorScheme {
  private readonly document = inject(DOCUMENT);
  readonly dark = signal(
    this.document.documentElement.classList.contains('app-dark'),
  );
  toggle(): void {
    this.dark.update((value) => !value);
    this.document.documentElement.classList.toggle('app-dark', this.dark());
  }
}
