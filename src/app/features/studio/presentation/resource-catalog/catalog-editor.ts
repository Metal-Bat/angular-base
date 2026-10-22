import { Locale } from '../../../../core/localization/locale';
import { CatalogBusinessField } from '../catalog-business-field';
import { JsonValue } from '../../../forms/domain/runtime-document';
import { SelectEscape } from '../../../../shared/ui/select-escape';
import { ActorState } from '../../../../core/auth/actor-state';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  viewChild,
} from '@angular/core';
import type { FieldSpec } from '../../domain/authoring';
import type { ResourceCatalog } from './resource-catalog';
import { SelectModule } from 'primeng/select';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-catalog-editor',
  imports: [
    CatalogBusinessField,
    SelectEscape,
    SelectModule,
    ControlField,
    FormsModule,
    ButtonDirective,
    LocalizePipe,
  ],
  templateUrl: './catalog-editor.html',
  styleUrl: './resource-catalog.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CatalogEditor {
  private readonly locale = inject(Locale);
  hintText(field: FieldSpec): string {
    return this.hints(field)
      .map((hint) => this.locale.text(hint.label) + hint.value)
      .join(' · ');
  }
  private readonly editor =
    viewChild<ElementRef<HTMLFormElement>>('catalogEditor');
  private readonly injector = inject(Injector);
  private readonly actor = inject(ActorState);
  constructor() {
    let returnFocus: HTMLElement | null = null;
    effect(() => {
      const vm = this.view();
      const opened = vm.formOpen();
      const epoch = this.actor.epoch;
      if (opened) {
        returnFocus = document.activeElement as HTMLElement | null;
        afterNextRender(
          () => {
            if (vm.formOpen() && this.actor.epoch === epoch) {
              this.editor()
                ?.nativeElement.querySelector<HTMLElement>(
                  'input, textarea, [role="combobox"]',
                )
                ?.focus();
            }
          },
          { injector: this.injector },
        );
      } else if (returnFocus) {
        const target = returnFocus;
        returnFocus = null;
        afterNextRender(
          () => {
            if (
              this.actor.epoch === epoch &&
              target.isConnected &&
              !target.closest('[hidden]')
            ) {
              target.focus();
            }
          },
          { injector: this.injector },
        );
      }
    });
  }
  businessField(field: FieldSpec): boolean {
    return [
      'client_targets',
      'renderer_capabilities',
      'form_ref_id',
      'workflow_ref_id',
      'client_ref_id',
    ].includes(field.key);
  }
  typedChange(field: FieldSpec, value: JsonValue | undefined): void {
    this.view().change(
      field,
      field.type === 'json'
        ? (JSON.stringify(value) ?? '')
        : String(value ?? ''),
    );
  }

  hints(field: FieldSpec): { label: string; value: string }[] {
    const hints: { label: string; value: string }[] = [];
    for (const [key, label] of [
      ['minLength', 'Minimum characters'],
      ['maxLength', 'Maximum characters'],
    ]) {
      if (field.schema[key]) {
        hints.push({ label, value: ': ' + field.schema[key] });
      }
    }
    if (field.type === 'json' && !this.businessField(field)) {
      hints.push({ label: 'JSON document', value: '' });
    }
    if (field.key === 'code') {
      hints.push({
        label: 'Use letters, numbers, dots, underscores or hyphens.',
        value: '',
      });
    }
    return hints;
  }

  readonly view =
    input.required<
      Pick<
        ResourceCatalog,
        | 'busy'
        | 'canSave'
        | 'settingsErrors'
        | 'change'
        | 'closeForm'
        | 'controlsDisabled'
        | 'spec'
        | 'dirty'
        | 'display'
        | 'enumChoices'
        | 'error'
        | 'fields'
        | 'formOpen'
        | 'invalid'
        | 'key'
        | 'save'
        | 'selected'
        | 'values'
      >
    >();
  readonly visibleFields = computed(() => {
    const vm = this.view();
    return vm.key === 'form-versions'
      ? vm
          .fields()
          .filter(
            (field) => field.key === 'number' || field.key === 'form_ref_id',
          )
      : vm.fields();
  });
}
