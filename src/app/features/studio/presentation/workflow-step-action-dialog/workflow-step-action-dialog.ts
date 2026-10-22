import { Locale } from '../../../../core/localization/locale';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { CanvasNode } from '../../domain/workflow-authoring';
import { inspectorFor } from '../../domain/node-inspector';
import { readablePalette } from '../../domain/workflow-labels';
import { StepAction } from '../../domain/workflow-step-actions';

@Component({
  selector: 'app-workflow-step-action-dialog',
  imports: [
    FormsModule,
    DialogModule,
    ButtonDirective,
    InputText,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './workflow-step-action-dialog.html',
  host: { style: 'display: contents' },
  styles:
    'label { display:block; margin-block:.75rem .35rem; } input { inline-size:100%; box-sizing:border-box; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowStepActionDialog {
  private readonly locale = inject(Locale);
  readonly request = input<StepAction | null>(null);
  readonly actionLabel = computed(() =>
    this.request()?.mode === 'insert' ? 'Insert step' : 'Add next',
  );
  readonly catalog = input.required<readonly JsonObject[]>();
  readonly nodes = input.required<readonly CanvasNode[]>();
  readonly graph = input.required<JsonObject>();
  readonly disabled = input(false);
  readonly error = input('');
  readonly applied = output<{ type: string; outcome: string }>();
  readonly cancelled = output<void>();
  readonly type = linkedSignal(() => {
    this.request();
    return '';
  });
  readonly outcome = linkedSignal(() => {
    this.request();
    this.type();
    return '';
  });
  readonly types = computed(() =>
    readablePalette(
      this.catalog().filter((entry) => {
        const handler = (entry['metadata'] as JsonObject | undefined)?.[
          'handler_key'
        ];
        return (
          entry['category'] === 'step_type' &&
          handler !== 'start' &&
          (this.request()?.mode !== 'insert' || handler !== 'finish')
        );
      }),
      '',
    ),
  );
  readonly typeOptions = computed(() => {
    this.locale.language();
    return this.types().map((entry) => ({
      key: entry.key,
      label:
        entry.title +
        (entry.typeLabel !== entry.title
          ? ' · ' + this.locale.text(entry.typeLabel)
          : '') +
        (entry.versionNumber
          ? ' · ' + this.locale.text('Version') + ' ' + entry.versionNumber
          : ''),
    }));
  });
  readonly conflict = computed(
    () =>
      this.occupied().includes(this.outcome().trim()) ||
      (this.declared().length > 0 && !this.choices().length),
  );
  readonly declared = computed(() => {
    const request = this.request();
    if (!request) {
      return [];
    }
    if (request.mode === 'next') {
      return (
        this.nodes().find((node) => node.key === request.source)?.outcomes ?? []
      );
    }
    const entry = this.catalog().find((row) => row['key'] === this.type());
    const metadata = entry?.['metadata'] as JsonObject | undefined;
    return metadata
      ? (inspectorFor(
          {
            key: 'pending',
            type_code: metadata['code'],
            type_version_ref: metadata['ref_id'],
            config: {},
          },
          this.catalog(),
        )?.outcomes ?? [])
      : [];
  });
  readonly occupied = computed(() =>
    this.request()?.mode === 'next'
      ? ((this.graph()['transitions'] ?? []) as readonly JsonObject[])
          .filter((edge) => edge['source'] === this.request()?.source)
          .map((edge) => String(edge['outcome']))
      : [],
  );
  readonly choices = computed(() =>
    this.declared().filter((outcome) => !this.occupied().includes(outcome)),
  );
  readonly valid = computed(
    () =>
      !this.disabled() &&
      this.types().some((entry) => entry.key === this.type()) &&
      !!this.outcome().trim() &&
      this.outcome().trim().length <= 64 &&
      !this.occupied().includes(this.outcome().trim()) &&
      (!this.declared().length ||
        this.choices().includes(this.outcome().trim())),
  );
  apply(): void {
    if (this.valid()) {
      this.applied.emit({ type: this.type(), outcome: this.outcome().trim() });
    }
  }
}
