import { formPages, pageRender } from '../../domain/form-pages';
import { validateRuntime } from '../../domain/runtime-validation';
import { effectiveRequired } from '../../domain/resolved-behavior';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { JsonObject, RuntimeDocument } from '../../domain/runtime-document';
import { unsupportedNodes } from '../../domain/primitive-registry';
import { FieldEdit, fieldValue } from '../../domain/canonical-values';
import { RuntimeNode } from '../runtime-node/runtime-node';
import { ValueTextPipe } from '../value-text-pipe';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
@Component({
  selector: 'app-runtime-form',
  imports: [RuntimeNode, ValueTextPipe, LocalizePipe],
  templateUrl: './runtime-form.html',
  styleUrl: './runtime-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuntimeForm {
  readonly document = input.required<RuntimeDocument>();
  readonly data = input.required<JsonObject>();
  readonly busy = input(false);
  readonly issues = input<readonly { pointer: string; message: string }[]>([]);
  readonly edit = output<FieldEdit>();
  readonly unsupported = computed(() =>
    unsupportedNodes(this.document().render),
  );
  readonly fieldValue = fieldValue;
  readonly pages = computed(() => formPages(this.document()));
  readonly page = signal(0);
  readonly pageError = signal('');
  readonly root = computed(() => {
    const document = this.document();
    const page = this.pages()[this.page()];
    return page && document.purpose !== 'print'
      ? pageRender(document.render, page.scopes)
      : document.render;
  });
  constructor() {
    effect(() => {
      void this.document().identity.design;
      void this.document().identity.view;
      if (this.page() >= this.pages().length) {
        this.page.set(0);
      }
    });
  }
  next(): void {
    const page = this.pages()[this.page()];
    if (!page || this.busy()) {
      return;
    }
    const required = effectiveRequired(this.document()).filter((scope) =>
      page.scopes.some(
        (parent) => scope === parent || scope.startsWith(parent + '/'),
      ),
    );
    const issues = validateRuntime(
      this.document(),
      this.data(),
      required,
    ).filter((issue) =>
      page.scopes.some((scope) =>
        issue.pointer.startsWith(
          scope.replaceAll('/properties', '').replaceAll('/items', ''),
        ),
      ),
    );
    if (
      ['edit', 'correction'].includes(this.document().purpose) &&
      issues.length
    ) {
      this.pageError.set('Complete the required fields on this page');
      return;
    }
    this.pageError.set('');
    this.page.update((value) => Math.min(value + 1, this.pages().length - 1));
  }
}
