import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { EditorPort } from '../../application/workspace-ports';
@Component({
  selector: 'app-case-overrides',
  imports: [FormsModule, LocalizePipe],
  templateUrl: './case-overrides.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseOverrides {
  readonly editor = input.required<EditorPort>();
  readonly overrideScope = signal('');
  readonly overrideValue = signal('');
  readonly overrideReason = signal('');
  async override(operation: 'set' | 'reset'): Promise<void> {
    const field = this.editor()
      .document()
      ?.fields.find((value) => value.scope === this.overrideScope());
    if (!field) {
      return;
    }
    const numeric =
      field.schema['type'] === 'number' || field.schema['type'] === 'integer';
    const value =
      operation === 'reset'
        ? null
        : numeric
          ? Number(this.overrideValue())
          : this.overrideValue();
    if (
      operation === 'set' &&
      numeric &&
      (!this.overrideValue().trim() || !Number.isFinite(Number(value)))
    ) {
      this.editor().error.set('Enter a valid number');
      return;
    }
    await this.editor().override(
      field.scope,
      operation,
      value,
      this.overrideReason(),
    );
  }
}
