import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';
import {
  inspectionContext,
  inspectionQuery,
  scopeRowCount,
} from '../../domain/form-inspection';
import { authoredNode } from '../../domain/form-authoring';
import { renderOf } from '../../domain/form-editing';
import type { FormBuilder } from '../form-builder/form-builder';
const optionStates: Readonly<Record<string, string>> = {
  READY: 'Available options',
  EMPTY: 'No options',
  BLOCKED: 'Options are unavailable until their dependencies are complete.',
  CLIENT_FETCH: 'This source requires runtime fetching.',
};
@Component({
  selector: 'app-form-interaction-preview',
  imports: [FormsModule, ButtonDirective, InputTextModule, LocalizePipe],
  templateUrl: './form-interaction-preview.html',
  styleUrl: './form-interaction-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormInteractionPreview {
  readonly locale = inject(Locale);
  readonly view =
    input.required<
      Pick<
        FormBuilder,
        | 'documents'
        | 'selected'
        | 'data'
        | 'selectedLabel'
        | 'inspect'
        | 'busy'
        | 'pending'
        | 'diagnostics'
      >
    >();
  readonly search = linkedSignal(() => {
    this.view().selected();
    return '';
  });
  readonly page = linkedSignal(() => {
    this.view().selected();
    return '1';
  });
  readonly inspectionError = linkedSignal(() => {
    this.view().selected();
    return '';
  });
  readonly selectedNode = computed(() => {
    const view = this.view();
    return authoredNode(renderOf(view.documents()), view.selected());
  });
  readonly optionField = computed(() =>
    ['choice', 'user', 'group'].includes(
      String(this.selectedNode()['component']),
    ),
  );
  readonly navigationField = computed(
    () => !!this.selectedNode()['navigation'],
  );
  readonly positions = linkedSignal(() => {
    this.view().selected();
    const count = scopeRowCount(String(this.selectedNode()['scope'] ?? ''));
    return Array.from({ length: count }, () => '');
  });
  setPosition(index: number, value: string): void {
    this.positions.update((rows) =>
      rows.map((row, i) => (i === index ? value : row)),
    );
  }
  async preview(tool: 'options' | 'navigation'): Promise<void> {
    const view = this.view();
    if (view.busy() || view.pending().length) {
      return;
    }
    try {
      const current = inspectionContext(view, tool);
      const search = this.search();
      const page = this.page();
      const rows = this.positions();
      const query = inspectionQuery(
        tool,
        view.documents(),
        view.selected(),
        view.data(),
        {
          search: this.search(),
          page: this.page(),
          rows: this.positions(),
        },
      );
      this.inspectionError.set('');
      this.resultText.set('');
      await view.inspect(tool, query);
      if (
        current() &&
        search === this.search() &&
        page === this.page() &&
        rows === this.positions()
      ) {
        this.resultText.set(view.diagnostics());
      }
    } catch (error) {
      this.inspectionError.set(
        error instanceof Error ? error.message : 'Preview is incompatible',
      );
    }
  }

  private readonly resultText = linkedSignal(() => {
    this.view().selected();
    this.view().documents();
    this.view().data();
    return '';
  });
  private readonly result = computed<JsonObject>(() => {
    try {
      if (this.resultText() !== this.view().diagnostics()) {
        return {};
      }
      const value: unknown = JSON.parse(this.resultText());
      return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as JsonObject)
        : {};
    } catch {
      return {};
    }
  });
  readonly optionResult = computed(() => {
    const value = this.result();
    if (
      typeof value['state'] !== 'string' ||
      !optionStates[value['state']] ||
      !Array.isArray(value['items'])
    ) {
      return null;
    }
    return {
      message: optionStates[value['state']],
      page: typeof value['page'] === 'number' ? value['page'] : 1,
      items: value['items'].flatMap((item) =>
        item &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        typeof item['value'] === 'string'
          ? [item['value']]
          : [],
      ),
    };
  });
  readonly navigationResult = computed(() => {
    const plan = this.result()['plan'];
    return (
      !!plan &&
      typeof plan === 'object' &&
      !Array.isArray(plan) &&
      (plan as JsonObject)['dialect'] === 'bpms.navigation/1'
    );
  });
}
