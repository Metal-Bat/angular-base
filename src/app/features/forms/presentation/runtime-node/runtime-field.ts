import { MenuModule } from 'primeng/menu';
import { textareaRows } from '../../domain/presentation-rows';
import { InputTextModule } from 'primeng/inputtext';
import type { MenuItem } from 'primeng/api';
import { Locale } from '../../../../core/localization/locale';
import { MISSING } from '../../domain/canonical-values';
import { effectiveRequired } from '../../domain/resolved-behavior';
import { TemporalControl } from '../../../../shared/ui/temporal-control/temporal-control';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import type { RuntimeNode } from './runtime-node';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { ButtonDirective } from 'primeng/button';
import { ChoiceControl } from '../choice-control/choice-control';
import { FormValue } from '../form-value/form-value';
import { valueKinds, valueLabels } from '../../domain/value-labels';
import { FieldWrapper } from '../../../../shared/ui/field-wrapper/field-wrapper';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-runtime-field',
  imports: [
    InputTextModule,
    MenuModule,
    TemporalControl,
    SelectControl,
    ButtonDirective,
    ChoiceControl,
    FormValue,
    FieldWrapper,
    LocalizePipe,
  ],
  templateUrl: './runtime-field.html',
  styleUrl: './runtime-node.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class RuntimeField {
  readonly kinds = computed(() => valueKinds(this.view().document().render));
  readonly labels = computed(() => valueLabels(this.view().document().render));
  readonly required = computed(() =>
    effectiveRequired(this.view().document()).includes(
      this.view().node().scope ?? '',
    ),
  );
  readonly placeholder = computed(() => {
    const options = this.view().node().display['options'] as
      Record<string, unknown> | undefined;
    return typeof options?.['placeholder'] === 'string'
      ? options['placeholder']
      : '';
  });
  readonly rows = computed(() =>
    textareaRows(this.view().node().display['options']),
  );
  private readonly locale = inject(Locale);
  readonly actions = computed<MenuItem[]>(() => {
    const vm = this.view();
    this.locale.language();
    if (!vm.writable()) {
      return [];
    }
    const actions: MenuItem[] = [];
    if (vm.nullable() && vm.value() !== null) {
      actions.push({
        label: this.locale.text('Set null'),
        command: (): void => vm.set(null),
      });
    }
    if (
      vm.value() !== MISSING &&
      !effectiveRequired(vm.document()).includes(vm.node().scope ?? '')
    ) {
      actions.push({
        label: this.locale.text('Remove value'),
        command: (): void => vm.clear(),
      });
    }
    return actions;
  });
  readonly view =
    input.required<
      Pick<
        RuntimeNode,
        | 'accessibleLabel'
        | 'description'
        | 'bool'
        | 'choice'
        | 'clear'
        | 'data'
        | 'document'
        | 'edit'
        | 'errors'
        | 'indices'
        | 'instance'
        | 'inputValue'
        | 'node'
        | 'nullable'
        | 'path'
        | 'pointer'
        | 'set'
        | 'text'
        | 'value'
        | 'writable'
      >
    >();
}
