import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ActorState } from '../../../../core/auth/actor-state';
import { SessionContext } from '../../../../core/auth/session-context';
import { Feedback } from '../../../../core/feedback/feedback';
import { hasPermissions } from '../../../../core/permissions/area-access';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { RecordSummary } from '../../../../shared/ui/record-summary/record-summary';
import { RecordTable } from '../../../../shared/ui/record-table/record-table';
import { emptyQuery } from '../../../../shared/domain/list-query';
import { fieldLabel } from '../../../../shared/domain/field-label';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { ADMIN_API } from '../../bindings';
import {
  AdminCommand,
  AdminInput,
  AdminResult,
  freezeCommand,
} from '../../domain/admin-command';
import {
  actionContext,
  actionErrors,
  actionInput,
  inputSchema,
  knownTarget,
  pageInput,
} from '../../domain/action-input';
import { setAt } from '../../domain/reference-options';
import { SchemaInput } from '../schema-input/schema-input';
import { ReferencePicker } from '../reference-picker/reference-picker';
@Component({
  selector: 'app-resource-actions',
  imports: [
    FormsModule,
    ButtonModule,
    DialogModule,
    LocalizePipe,
    RecordSummary,
    RecordTable,
    SchemaInput,
    ReferencePicker,
  ],
  templateUrl: './resource-actions.html',
  styleUrl: './resource-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceActions {
  private readonly actor = inject(ActorState);
  private readonly api = inject(ADMIN_API);
  private readonly session = inject(SessionContext);
  private readonly feedback = inject(Feedback);
  readonly group = input.required<string>();
  readonly base = input.required<string>();
  readonly row = input<JsonObject>({});
  readonly tools = input(false);
  readonly disabled = input(false);
  readonly changed = output<void>();
  readonly command = signal<AdminCommand | null>(null);
  readonly input = signal<AdminInput>({ body: {}, path: {}, query: {} });
  readonly errors = signal<Record<string, string>>({});
  readonly error = signal('');
  readonly notice = signal('');
  readonly busy = signal(false);
  readonly response = signal<AdminResult | null>(null);
  readonly currentSelection = signal<JsonObject | null>(null);
  readonly query = signal(emptyQuery());
  readonly picker = viewChild.required<ReferencePicker>('references');
  readonly Object = Object;
  readonly locations = ['path', 'query', 'body'] as const;
  readonly labels = { path: 'Target', query: 'Options', body: 'Values' };
  private generation = 0;
  private scope = '';
  private dirty = false;
  private applied: AdminInput | null = null;
  readonly actions = computed(() => {
    const actor = this.session.snapshot();
    return this.api
      .commands(this.group())
      .filter((command) => {
        if (
          actor.status !== 'authenticated' ||
          !hasPermissions(actor.permissions, [command.permission])
        ) {
          return false;
        }
        const suffix = command.path.slice(this.base().length);
        const nested =
          command.path.startsWith(this.base() + '/{') &&
          !/^\/\{[^}]+\}$/.test(suffix) &&
          (!/\/(history|report)$/.test(suffix) || this.group() === 'processes');
        const run =
          this.group() === 'tasks' && command.path === '/api/v1/tasks/run';
        if (this.tools()) {
          return (
            !command.mutation &&
            !command.path.startsWith(this.base() + '/{') &&
            !/\/(search|report|history)$/.test(command.path) &&
            !/\/\{ref_id\}$/.test(command.path)
          );
        }
        if (
          this.group() === 'agents' &&
          this.row()['status'] !== 'DRAFT' &&
          command.path.endsWith('/publish')
        ) {
          return false;
        }
        return nested || run;
      })
      .map((command) => ({
        ...command,
        title: command.path.endsWith('/publish') ? 'Publish' : command.title,
      }));
  });
  readonly bodyContext = computed(() =>
    actionContext(this.row(), this.input()),
  );
  readonly resultRows = computed(() =>
    Array.isArray(this.response()?.value)
      ? (this.response()!.value as JsonObject[])
      : [],
  );
  readonly columns = computed(() => {
    const keys = new Set(this.resultRows().flatMap((row) => Object.keys(row)));
    return [...keys]
      .filter((key) => !/(ref|secret|password|token)/.test(key))
      .slice(0, 6)
      .map((key) => ({ key, label: fieldLabel(key) }));
  });
  readonly resultRecord = computed(() => {
    const value = this.response()?.value;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as JsonObject)
      : null;
  });
  readonly targetTitle = computed(() =>
    String(
      this.row()['name'] ||
        this.row()['task_name'] ||
        this.row()['code'] ||
        'Current record',
    ),
  );
  constructor() {
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
    effect(() => {
      const scope = [
        this.group(),
        this.base(),
        this.row()['ref_id'] ?? this.row()['task_id'] ?? '',
      ].join(':');
      if (scope !== this.scope) {
        this.scope = scope;
        this.clear();
      }
    });
  }
  clear(): void {
    this.generation++;
    this.command.set(null);
    this.input.set({ body: {}, path: {}, query: {} });
    this.errors.set({});
    this.error.set('');
    this.notice.set('');
    this.busy.set(false);
    this.response.set(null);
    this.currentSelection.set(null);
    this.dirty = false;
    this.applied = null;
    this.query.set(emptyQuery());
  }
  schema(location: keyof AdminInput): JsonObject {
    const command = this.command();
    if (!command) {
      return {};
    }
    const hidden =
      location === 'path'
        ? command.fields.path
            .filter((field) => this.hiddenTarget(field.key))
            .map((field) => field.key)
        : [];
    return inputSchema(command, location, hidden);
  }
  hiddenTarget(key: string): boolean {
    return knownTarget(key, this.row(), this.currentSelection());
  }
  async open(command: AdminCommand): Promise<void> {
    if (this.disabled() || this.busy()) {
      return;
    }
    if (
      this.dirty &&
      !(await this.feedback.confirm('Discard unsaved changes?'))
    ) {
      return;
    }
    this.generation++;
    this.command.set(command);
    this.response.set(null);
    this.errors.set({});
    this.error.set('');
    this.notice.set('');
    this.applied = null;
    this.dirty = false;
    const values = actionInput(
      command,
      this.row(),
      this.base(),
      this.currentSelection(),
    );
    this.input.set(values);
    if (
      !command.mutation &&
      command.fields.path.every(
        (field) => values.path[field.key] !== undefined,
      ) &&
      !command.fields.body.some((field) => field.required)
    ) {
      await this.execute();
    }
  }
  change(location: keyof AdminInput, value: JsonValue | undefined): void {
    this.input.update((values) => ({
      ...values,
      [location]: (value as JsonObject) ?? {},
    }));
    this.dirty = true;
    this.errors.set({});
  }
  pick(path: string, value: string): void {
    const [location, ...remaining] = path.split('.');
    this.change(
      location as keyof AdminInput,
      setAt(
        this.input()[location as keyof AdminInput],
        remaining.join('.'),
        value,
      ),
    );
  }
  async canLeave(): Promise<boolean> {
    return (
      !this.busy() &&
      (!this.dirty || (await this.feedback.confirm('Discard unsaved changes?')))
    );
  }
  async close(): Promise<void> {
    if (this.busy()) {
      return;
    }
    if (
      !this.dirty ||
      (await this.feedback.confirm('Discard unsaved changes?'))
    ) {
      this.command.set(null);
      this.input.set({ body: {}, path: {}, query: {} });
      this.errors.set({});
      this.response.set(null);
      this.error.set('');
      this.dirty = false;
      this.generation++;
    }
  }
  async execute(page?: number, size = this.query().size): Promise<void> {
    const command = this.command();
    if (!command || this.busy() || this.disabled()) {
      return;
    }
    const generation = this.generation;
    const epoch = this.actor.epoch;
    const values = pageInput(
      command,
      page !== undefined && this.applied ? this.applied : this.input(),
      page,
      size,
    );
    const errors = actionErrors(command, values);
    this.errors.set(errors);
    if (Object.keys(errors).length) {
      this.error.set('Complete the required fields with valid values.');
      return;
    }
    let snapshot: AdminInput;
    try {
      snapshot = freezeCommand(command, values);
    } catch {
      this.error.set('Complete the required fields with valid values.');
      return;
    }
    if (
      command.mutation &&
      !(await this.feedback.confirm(
        command.title + ' — ' + this.targetTitle() + '?',
      ))
    ) {
      return;
    }
    if (!this.isCurrent(command, generation, epoch)) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.api.send(command, snapshot);
      if (generation !== this.generation) {
        return;
      }
      this.accept(command, result, snapshot);
    } catch (error) {
      if (generation === this.generation) {
        this.fail(error);
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
    if (command.mutation && generation === this.generation && !this.error()) {
      this.changed.emit();
    }
  }
  private isCurrent(
    command: AdminCommand,
    generation: number,
    epoch: number,
  ): boolean {
    const actor = this.session.snapshot();
    return (
      generation === this.generation &&
      actor.status === 'authenticated' &&
      this.actor.epoch === epoch &&
      hasPermissions(actor.permissions, [command.permission])
    );
  }
  private accept(
    command: AdminCommand,
    result: AdminResult,
    snapshot: AdminInput,
  ): void {
    this.response.set(result);
    this.dirty = false;
    this.applied = snapshot;
    this.query.set({
      ...emptyQuery(),
      page: result.page,
      size: Number(snapshot.body['size'] ?? snapshot.query['size'] ?? 20),
    });
    if (command.mutation) {
      this.notice.set(
        'Command accepted. Read current state to verify completion.',
      );
      this.input.set({
        body: {},
        path: snapshot.path,
        query: snapshot.query,
      });
    }
  }
  private fail(error: unknown): void {
    this.error.set(
      error instanceof ApiFailure
        ? error.message
        : 'The result could not be confirmed. Your input is retained; read current state before retrying.',
    );
    if (error instanceof ApiFailure) {
      this.errors.set(
        Object.fromEntries(
          error.issues.map((issue) => [
            issue.pointer.replace(/^\//, '').replaceAll('/', '.'),
            issue.code,
          ]),
        ),
      );
    }
  }
  selectResult(row: Record<string, unknown>): void {
    this.currentSelection.set(row as JsonObject);
    this.notice.set('Selected record');
  }
}
