import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ColorScheme } from '../../../core/theme/color-scheme';
import { Locale } from '../../../core/localization/locale';
import { Preferences } from '../../../core/auth/preferences';
import { LocalizePipe } from '../localize-pipe';

@Component({
  selector: 'app-theme-picker',
  imports: [FormsModule, SelectModule, LocalizePipe],
  host: { style: 'display:inline-flex; min-width:0; max-width:100%' },
  templateUrl: './theme-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemePicker {
  readonly inputId = input('');
  readonly scheme = inject(ColorScheme);
  readonly locale = inject(Locale);
  readonly preferences = inject(Preferences);
  readonly groups = computed(() =>
    (['light', 'dark'] as const).map((mode) => ({
      label: this.locale.text(mode === 'light' ? 'Light mode' : 'Dark mode'),
      icon: mode === 'light' ? 'pi pi-sun' : 'pi pi-moon',
      items: this.scheme.palettes.map((palette) => ({
        value: `${palette.key}-${mode}`,
        label: `${this.locale.text(palette.name)} · ${this.locale.text(mode === 'light' ? 'Light' : 'Dark')}`,
        color: `var(--p-${palette.key}-500)`,
      })),
    })),
  );
}
