import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { AuthSession } from '../../../../core/auth/auth-session';
import { SessionContext } from '../../../../core/auth/session-context';
import { hasPermissions } from '../../../../core/permissions/area-access';
import { Feedback } from '../../../../core/feedback/feedback';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { FieldSpec, parseDocument } from '../../../studio/domain/authoring';
import { displayValue } from '../../../studio/presentation/resource-catalog/resource-values';
import { ADMIN_API } from '../../bindings';
import {
  AdminCommand,
  AdminInput,
  AdminResult,
  freezeCommand,
} from '../../domain/admin-command';
@Component({
  selector: 'app-admin-console',
  imports: [FormsModule, LocalizePipe],
  templateUrl: './admin-console.html',
  styleUrl: './admin-console.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminConsole {
  private readonly api = inject(ADMIN_API);
  private readonly session = inject(SessionContext);
  private readonly auth = inject(AuthSession);
  private readonly feedback = inject(Feedback);
  private generation = 0;
  readonly group = inject(ActivatedRoute).snapshot.data['adminGroup'] as string;
  readonly title =
    this.api.groups().find((group) => group.key === this.group)?.title ??
    'Administration';
  readonly commands = computed(() => {
    const actor = this.session.snapshot();
    return actor.status === 'authenticated'
      ? this.api
          .commands(this.group)
          .filter((command) =>
            hasPermissions(actor.permissions, [command.permission]),
          )
      : [];
  });
  readonly selected = signal<AdminCommand | null>(null);
  readonly currentRow = signal<JsonObject | null>(null);
  readonly input = signal<AdminInput>({ body: {}, path: {}, query: {} });
  readonly result = signal<AdminResult | null>(null);
  readonly error = signal('');
  readonly invalid = signal<readonly string[]>([]);
  readonly busy = signal(false);
  readonly dirty = signal(false);
  readonly notice = signal('');
  readonly locations = ['path', 'query', 'body'] as const;
  readonly locationLabels = {
    path: 'Target',
    query: 'Filters',
    body: 'Values',
  };
  readonly json = JSON.stringify;
  readonly rows = computed(() => {
    const value = this.result()?.value;
    return Array.isArray(value)
      ? (value.filter(
          (item) => item && typeof item === 'object' && !Array.isArray(item),
        ) as JsonObject[])
      : [];
  });
  constructor() {
    const unregister = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      unregister();
    });
    this.select(this.commands()[0]?.id ?? '');
  }
  clear(): void {
    this.generation++;
    this.currentRow.set(null);
    this.selected.set(null);
    this.input.set({ body: {}, path: {}, query: {} });
    this.result.set(null);
    this.error.set('');
    this.notice.set('');
    this.invalid.set([]);
    this.dirty.set(false);
    this.busy.set(false);
  }
  async canLeave(): Promise<boolean> {
    return (
      !this.dirty() ||
      this.feedback.confirm('Discard unsaved administration changes?')
    );
  }
  select(id: string): void {
    const command = this.commands().find((item) => item.id === id);
    if (!command || this.busy()) {
      return;
    }
    this.generation++;
    this.selected.set(command);
    this.result.set(null);
    this.error.set('');
    this.notice.set('');
    this.invalid.set([]);
    const values: AdminInput = { body: {}, path: {}, query: {} };
    for (const location of this.locations) {
      for (const field of command.fields[location]) {
        if (field.initial !== undefined) {
          values[location][field.key] = structuredClone(field.initial);
        } else if (field.key === 'page') {
          values[location][field.key] = 1;
        } else if (field.key === 'size') {
          values[location][field.key] = 20;
        }
      }
    }
    const row = this.currentRow();
    if (row) {
      for (const location of this.locations) {
        for (const field of command.fields[location]) {
          if (row[field.key] !== undefined && !this.secret(field)) {
            values[location][field.key] = structuredClone(row[field.key]);
          }
        }
      }
    }
    this.input.set(values);
    this.dirty.set(false);
  }
  async choose(id: string): Promise<void> {
    if (await this.canLeave()) {
      this.select(id);
    }
  }
  display(field: FieldSpec, location: keyof AdminInput): string {
    return displayValue(field, this.input()[location]);
  }
  secret(field: FieldSpec): boolean {
    return /password|secret|token|api_key/i.test(field.key);
  }
  change(
    field: FieldSpec,
    location: keyof AdminInput,
    raw: string | boolean,
  ): void {
    const key = location + '.' + field.key;
    this.dirty.set(true);
    try {
      const value: JsonValue | undefined =
        raw === '' && !field.required
          ? undefined
          : field.type === 'json'
            ? parseDocument('{"value":' + String(raw) + '}')['value']
            : field.type === 'boolean'
              ? Boolean(raw)
              : field.type === 'number'
                ? Number(raw)
                : String(raw);
      if (typeof value === 'number' && !Number.isFinite(value)) {
        throw Error('Invalid number');
      }
      const next = { ...this.input()[location] };
      if (value === undefined) {
        delete next[field.key];
      } else {
        next[field.key] = value;
      }
      this.input.update((input) => ({ ...input, [location]: next }));
      this.invalid.update((keys) => keys.filter((item) => item !== key));
      this.error.set(
        this.invalid().length
          ? 'Correct invalid fields before continuing.'
          : '',
      );
    } catch {
      this.invalid.update((keys) => [...new Set([...keys, key])]);
      this.error.set('Invalid value: ' + field.title);
    }
  }
  private accept(result: AdminResult): void {
    this.result.set(result);
    if (
      result.value &&
      typeof result.value === 'object' &&
      !Array.isArray(result.value) &&
      (result.value as JsonObject)['ref_id']
    ) {
      this.currentRow.set(result.value as JsonObject);
    }
  }
  private targetLabel(snapshot: AdminInput): string {
    return String(
      snapshot.path['ref_id'] ??
        snapshot.path['task_id'] ??
        snapshot.body['username'] ??
        this.title,
    );
  }
  private canSend(command: AdminCommand, generation: number): boolean {
    return (
      generation === this.generation &&
      !this.busy() &&
      this.commands().some((item) => item.id === command.id)
    );
  }
  async execute(page?: number): Promise<void> {
    const command = this.selected();
    if (
      !command ||
      this.busy() ||
      this.invalid().length ||
      !this.commands().some((item) => item.id === command.id)
    ) {
      return;
    }
    const generation = this.generation;
    let snapshot: AdminInput;
    try {
      const input = structuredClone(this.input());
      if (
        page !== undefined &&
        command.fields.body.some((field) => field.key === 'page')
      ) {
        input.body['page'] = page;
      }
      snapshot = freezeCommand(command, input);
    } catch {
      this.error.set('Complete the required fields with valid values.');
      return;
    }
    if (
      command.mutation &&
      !(await this.feedback.confirm(
        command.title + ' — target ' + this.targetLabel(snapshot) + '?',
      ))
    ) {
      return;
    }
    if (!this.canSend(command, generation)) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.result.set(null);
    try {
      const result = await this.api.send(command, snapshot);
      if (generation !== this.generation) {
        return;
      }
      this.accept(result);
      this.dirty.set(false);
      if (command.mutation) {
        this.notice.set(
          'Command accepted. Read current state to verify completion.',
        );
        // Credentials are transient inputs; never retain them after an accepted command.
        this.input.set({
          body: {},
          path: snapshot.path,
          query: snapshot.query,
        });
        await this.auth.revalidate();
      }
    } catch (error) {
      if (generation === this.generation) {
        this.error.set(
          error instanceof ApiFailure && error.httpStatus === 409
            ? 'The target changed. Your input is retained; read current state before retrying.'
            : 'The result could not be confirmed. Your input is retained; read current state before retrying.',
        );
        if (error instanceof ApiFailure && error.requestId) {
          this.notice.set('Request ID: ' + error.requestId);
        }
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  use(row: JsonObject): void {
    const command = this.selected();
    if (!command || this.busy()) {
      return;
    }
    this.currentRow.set(structuredClone(row));
    const input = structuredClone(this.input());
    for (const location of this.locations) {
      for (const field of command.fields[location]) {
        if (row[field.key] !== undefined && !this.secret(field)) {
          input[location][field.key] = structuredClone(row[field.key]);
        }
      }
    }
    this.input.set(input);
    this.dirty.set(true);
  }
}
