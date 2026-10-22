import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { SelectControl } from '../../../shared/ui/select-control/select-control';
import { ThemePicker } from '../../../shared/ui/theme-picker/theme-picker';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import type { AppShell } from '../app-shell';

@Component({
  selector: 'app-workspace-preferences',
  imports: [SelectControl, ThemePicker, LocalizePipe],
  templateUrl: './workspace-preferences.html',
  styleUrl: './workspace-preferences.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspacePreferences {
  readonly view =
    input.required<Pick<AppShell, 'locale' | 'preferences' | 'setLanguage'>>();
  readonly narrow = signal(false);
  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const query = window.matchMedia?.('(max-width: 48rem)');
      const changed = (): void => {
        this.narrow.set(query?.matches ?? window.innerWidth <= 768);
      };
      changed();
      query?.addEventListener('change', changed);
      window.addEventListener('resize', changed);
      destroy.onDestroy(() => {
        query?.removeEventListener('change', changed);
        window.removeEventListener('resize', changed);
      });
    });
  }
  escape(event: Event, element: HTMLDetailsElement): void {
    if (this.narrow() && element.open) {
      event.preventDefault();
      element.open = false;
      element.querySelector('summary')?.focus();
    }
  }
}
