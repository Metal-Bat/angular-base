import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { FormValue } from '../../../forms/presentation/form-value/form-value';
import { CaseFeedback } from '../../../forms/application/form-resources';
import { RuntimeDocument } from '../../../forms/domain/runtime-document';
import { correctionLocations } from '../../domain/correction-feedback';
import { Locale } from '../../../../core/localization/locale';
@Component({
  selector: 'app-task-feedback',
  imports: [ButtonDirective, LocalizePipe, FormValue],
  templateUrl: './task-feedback.html',
  styleUrl: './task-feedback.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFeedback {
  readonly statusLabels: Readonly<Record<string, string>> = {
    OPEN: 'Needs correction',
    RESOLVED: 'Correction resolved',
  };
  readonly locale = inject(Locale);
  readonly document = input<RuntimeDocument | null>(null);
  readonly disabled = input(false);
  readonly fieldRequested = output<Pick<CaseFeedback, 'scope' | 'item'>>();
  readonly rows = computed(() => {
    const document = this.document();
    const entries = this.feedback();
    const targets =
      document && entries.length
        ? correctionLocations(
            document,
            new Set(entries.map((entry) => entry.scope)),
          )
        : [];
    return entries.map((entry) => {
      const matches = targets.filter(
        (target) =>
          target.scope === entry.scope && target.item_key === entry.item,
      );
      return { entry, target: matches.length === 1 ? matches[0] : null };
    });
  });
  rowLabel(row: string): string {
    return row
      .split('.')
      .map((position) => this.locale.number(Number(position)))
      .join('.');
  }
  readonly busy = input(false);
  readonly canResolve = input(false);
  readonly expanded = model(false);
  readonly feedback = input<readonly CaseFeedback[]>([]);
  readonly kinds = input<Readonly<Record<string, string>>>({});
  readonly labels = input<Readonly<Record<string, string>>>({});
  readonly resolved = output<string>();
}
