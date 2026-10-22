import {
  indicesFor,
  indicesFromPath,
  isItemScope,
  keysAt,
  rowPointer,
  scopeContainsPointer,
  scopePath,
} from '../../domain/row-values';
import { renderedField } from './field-focus';
import { ButtonDirective } from 'primeng/button';
import {
  formPages,
  hasVisibleScope,
  pageRender,
} from '../../domain/form-pages';
import { validateRuntime } from '../../domain/runtime-validation';
import { effectiveRequired } from '../../domain/resolved-behavior';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { JsonObject, RuntimeDocument } from '../../domain/runtime-document';
import { unsupportedNodes } from '../../domain/primitive-registry';
import { FieldEdit, fieldValue } from '../../domain/canonical-values';
import { RuntimeNode } from '../runtime-node/runtime-node';
import { FormValue } from '../form-value/form-value';
import { valueKinds, valueLabels } from '../../domain/value-labels';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
@Component({
  host: { class: 'console-fragment' },
  selector: 'app-runtime-form',
  imports: [ButtonDirective, RuntimeNode, FormValue, LocalizePipe],
  templateUrl: './runtime-form.html',
  styleUrl: './runtime-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuntimeForm {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly focusRequest = signal<{
    scope: string;
    keys: readonly string[];
    resource: string;
  } | null>(null);
  readonly navigationError = signal('');
  readonly locale = inject(Locale);
  readonly document = input.required<RuntimeDocument>();
  readonly data = input.required<JsonObject>();
  readonly busy = input(false);
  readonly issues = input<readonly { pointer: string; message: string }[]>([]);
  readonly edit = output<FieldEdit>();
  readonly unsupported = computed(() =>
    unsupportedNodes(this.document().render),
  );
  readonly fieldValue = fieldValue;
  readonly previousFields = computed(() =>
    this.document().fields.filter((field) => !isItemScope(field.scope)),
  );
  readonly kinds = computed(() => valueKinds(this.document().render));
  readonly labels = computed(() => valueLabels(this.document().render));
  readonly pages = computed(() => formPages(this.document()));
  readonly page = signal(0);
  readonly pageError = signal('');
  readonly priorExpanded = signal(false);
  readonly root = computed(() => {
    const document = this.document();
    const page = this.pages()[this.page()];
    return page && document.purpose !== 'print'
      ? pageRender(document.render, page.scopes)
      : document.render;
  });
  constructor() {
    afterRenderEffect({
      earlyRead: () => {
        const request = this.focusRequest();
        if (!request) {
          return null;
        }
        const document = this.document();
        const indices = indicesFor(document, request.scope, request.keys);
        return {
          element:
            !this.busy() &&
            request.resource === document.identity.resource &&
            indices
              ? renderedField(
                  this.host.nativeElement,
                  rowPointer(request.scope, indices),
                )
              : null,
        };
      },
      write: (result) => {
        const target = result();
        if (!target) {
          return;
        }
        this.focusRequest.set(null);
        this.navigationError.set(
          target.element?.isConnected ? '' : 'Field unavailable',
        );
        if (target.element?.isConnected) {
          if (target.element.matches('fieldset, section')) {
            target.element.tabIndex = -1;
          }
          target.element.focus({ preventScroll: true });
          target.element.scrollIntoView?.({
            block: 'center',
            inline: 'nearest',
          });
        }
      },
    });
    effect(() => {
      void this.document().identity.design;
      void this.document().identity.view;
      if (this.page() >= this.pages().length) {
        this.page.set(0);
      }
    });
  }
  focusField(scope: string, pointer: string): void {
    this.focusRequest.set(null);
    if (this.busy()) {
      return;
    }
    const document = this.document();
    try {
      if (
        !document.fields.some((field) => field.scope === scope) ||
        ![...document.policy.readable, ...document.policy.writable].includes(
          scope,
        )
      ) {
        throw Error('Unavailable field');
      }
      const indices = indicesFromPath(scope, pointer);
      const keys = keysAt(document, scope, indices);
      const pages = document.purpose === 'print' ? [] : this.pages();
      const visible = (page: number): boolean =>
        hasVisibleScope(
          pages.length
            ? pageRender(document.render, pages[page].scopes)
            : document.render,
          scope,
        );
      const target = visible(this.page())
        ? this.page()
        : pages.findIndex((_, index) => visible(index));
      if (target < 0) {
        throw Error('Unavailable field');
      }
      const blocking = this.issues().find((issue) =>
        pages[this.page()]?.scopes.some((current) =>
          scopeContainsPointer(current, issue.pointer),
        ),
      );
      if (target !== this.page() && blocking) {
        this.pageError.set(
          'Correct the invalid values on this page before leaving.',
        );
        const invalid = document.fields.find(
          (field) =>
            scopeContainsPointer(field.scope, blocking.pointer) &&
            scopePath(field.scope).length ===
              blocking.pointer.split('/').length - 1,
        );
        if (invalid) {
          this.focusRequest.set({
            scope: invalid.scope,
            keys: keysAt(
              document,
              invalid.scope,
              indicesFromPath(invalid.scope, blocking.pointer),
            ),
            resource: document.identity.resource,
          });
        }
        return;
      }
      this.pageError.set('');
      this.navigationError.set('');
      this.page.set(target);
      this.focusRequest.set({
        scope,
        keys,
        resource: document.identity.resource,
      });
    } catch {
      this.navigationError.set('Field unavailable');
    }
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
    const issues = [
      ...this.issues(),
      ...validateRuntime(this.document(), this.data(), required),
    ].filter((issue) =>
      page.scopes.some((scope) => scopeContainsPointer(scope, issue.pointer)),
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
