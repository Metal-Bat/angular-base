import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { RuntimeDocument } from '../../../forms/domain/runtime-document';
import {
  CorrectionInput,
  correctionTargetKey,
  correctionTargets,
} from '../../domain/correction-feedback';
@Component({
  selector: 'app-correction-feedback-editor',
  imports: [
    FormsModule,
    ButtonDirective,
    Textarea,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './correction-feedback-editor.html',
  styleUrl: './correction-feedback-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CorrectionFeedbackEditor {
  readonly document = input.required<RuntimeDocument>();
  readonly disabled = input(false);
  readonly entries = model<readonly CorrectionInput[]>([]);
  readonly targets = computed(() => correctionTargets(this.document()));
  readonly key = correctionTargetKey;
  available(row: CorrectionInput): boolean {
    return this.targets().some((target) => target.key === this.key(row));
  }
  add(): void {
    if (!this.disabled() && this.entries().length < 64) {
      this.entries.update((rows) => [
        ...rows,
        { scope: '', item_key: null, message: '' },
      ]);
    }
  }
  remove(index: number): void {
    if (!this.disabled()) {
      this.entries.update((rows) =>
        rows.filter((_, position) => position !== index),
      );
    }
  }
  message(index: number, message: string): void {
    if (!this.disabled()) {
      this.entries.update((rows) =>
        rows.map((row, position) =>
          position === index ? { ...row, message } : row,
        ),
      );
    }
  }
  select(index: number, key: string): void {
    const target = this.targets().find((row) => row.key === key);
    if (!this.disabled() && target) {
      this.entries.update((rows) =>
        rows.map((row, position) =>
          position === index
            ? { ...row, scope: target.scope, item_key: target.item_key }
            : row,
        ),
      );
    }
  }
}
