import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RuntimeForm } from '../runtime-form/runtime-form';
import { PREVIEW_DOCUMENT } from '../../bindings';
import { FieldEdit, replaceField } from '../../domain/canonical-values';
import { JsonObject } from '../../domain/runtime-document';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { Locale } from '../../../../core/localization/locale';
@Component({
  host: { class: 'console-page' },
  selector: 'app-runtime-preview',
  imports: [RuntimeForm, LocalizePipe],
  templateUrl: './runtime-preview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuntimePreview {
  readonly locale = inject(Locale);
  readonly runtime = inject(PREVIEW_DOCUMENT);
  readonly data = signal<JsonObject>(
    this.runtime.status === 'ready' ? this.runtime.document.canonical : {},
  );
  readonly error = signal('');
  edit(change: FieldEdit): void {
    this.error.set(change.error ?? '');
    if (!change.error) {
      this.data.set(replaceField(this.data(), change.scope, change.value));
    }
  }
}
