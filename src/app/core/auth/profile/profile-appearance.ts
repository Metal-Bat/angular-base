import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Preferences } from '../preferences';
import { ThemePicker } from '../../../shared/ui/theme-picker/theme-picker';
import { ControlField } from '../../../shared/ui/control-field/control-field';
import { SelectControl } from '../../../shared/ui/select-control/select-control';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-profile-appearance',
  imports: [
    ButtonModule,
    ControlField,
    SelectControl,
    ThemePicker,
    LocalizePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="mt-6 grid gap-4 rounded-xl border border-console-border bg-console-surface p-5"
      [attr.data-preference-status]="preferences.status()"
    >
      <h2>{{ 'Appearance and language' | localize }}</h2>
      <p>{{ 'Changes are saved automatically to your account.' | localize }}</p>
      <app-control-field controlId="profile-theme" label="Theme">
        <app-theme-picker class="w-52 max-w-full" inputId="profile-theme" />
      </app-control-field>
      <app-control-field controlId="profile-language" label="Language">
        <app-select-control
          class="w-32 max-w-full"
          inputId="profile-language"
          [ariaLabel]="'Language' | localize"
          [disabled]="locale.changing() || preferences.loading()"
          [value]="locale.language()"
          (selectionChanged)="language($event.target.value)"
        >
          @for (option of locale.languages; track option.code) {
            <option [attr.lang]="option.code" [value]="option.code">
              {{ option.name }}
            </option>
          }
        </app-select-control>
      </app-control-field>
      @if (scheme.systemAvailable) {
        <button
          pButton
          severity="secondary"
          type="button"
          [attr.aria-pressed]="scheme.mode() === 'system'"
          [disabled]="preferences.loading()"
          [outlined]="true"
          (click)="preferences.mode()"
        >
          {{ 'Use system appearance' | localize }}
        </button>
      }
      <button
        pButton
        severity="secondary"
        type="button"
        [disabled]="preferences.loading()"
        [text]="true"
        (click)="preferences.reset()"
      >
        {{ 'Reset appearance' | localize }}
      </button>
      <p role="status">{{ statusText() | localize }}</p>
      @if (preferences.sessionLanguage()) {
        <p>
          {{
            'Arabic applies to this session; saved language supports English and Persian.'
              | localize
          }}
        </p>
      }
      @if (preferences.status() === 'error') {
        <button
          pButton
          severity="secondary"
          type="button"
          [outlined]="true"
          (click)="preferences.load()"
        >
          {{ 'Reload saved preferences' | localize }}
        </button>
      }
    </section>
  `,
})
export class ProfileAppearance {
  readonly preferences = inject(Preferences);
  readonly scheme = this.preferences.scheme;
  readonly locale = this.preferences.locale;
  theme(value: unknown): void {
    this.preferences.theme(value);
  }
  language(value: unknown): Promise<void> {
    return this.preferences.language(value);
  }
  statusText(): string {
    switch (this.preferences.status()) {
      case 'loading':
        return 'Loading saved preferences…';
      case 'saving':
        return 'Saving preferences…';
      case 'saved':
        return 'Preferences saved.';
      case 'error':
        return 'Preferences could not be saved. Reload saved preferences before changing them again.';
      default:
        return 'Changes apply to this session.';
    }
  }
}
