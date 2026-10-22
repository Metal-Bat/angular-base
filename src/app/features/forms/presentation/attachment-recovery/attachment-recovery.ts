import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { Locale } from '../../../../core/localization/locale';
import { languageDirection } from '../../../../core/localization/languages';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { FormResources } from '../../application/form-resources';

@Component({
  host: { '[attr.dir]': 'direction()', '[attr.lang]': 'locale.language()' },
  selector: 'app-attachment-recovery',
  imports: [ButtonDirective, LocalizePipe],
  templateUrl: './attachment-recovery.html',
  styleUrl: './attachment-recovery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentRecovery {
  readonly locale = inject(Locale);
  readonly direction = computed(() =>
    languageDirection(this.locale.language()),
  );
  readonly resources = input.required<FormResources>();
  /** Missing/hidden original fields use the case-level fallback presenter. */
  readonly path = input<string | null>(null);
}
