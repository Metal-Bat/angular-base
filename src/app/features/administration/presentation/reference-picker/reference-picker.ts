import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ActorState } from '../../../../core/auth/actor-state';
import { SessionContext } from '../../../../core/auth/session-context';
import { Locale } from '../../../../core/localization/locale';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { hasPermissions } from '../../../../core/permissions/area-access';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { RecordTable } from '../../../../shared/ui/record-table/record-table';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { emptyQuery } from '../../../../shared/domain/list-query';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { ADMIN_API } from '../../bindings';
import { AdminCommand, AdminInput } from '../../domain/admin-command';
import {
  referenceChoice,
  referenceCommand,
} from '../../domain/reference-options';
@Component({
  selector: 'app-reference-picker',
  imports: [
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    ControlField,
    RecordTable,
    LocalizePipe,
  ],
  templateUrl: './reference-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferencePicker {
  private readonly api = inject(ADMIN_API, { optional: true });
  private readonly session = inject(SessionContext);
  private readonly document = inject(DOCUMENT);
  private returnFocus: HTMLElement | null = null;
  private readonly locale = inject(Locale);
  readonly context = input<JsonObject>({});
  readonly picked = output<{ path: string; value: string; label: string }>();
  readonly visible = signal(false);
  readonly rows = signal<readonly JsonObject[]>([]);
  readonly page = signal(1);
  readonly pages = signal(0);
  readonly size = signal(20);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly query = emptyQuery;
  search = '';
  private command: AdminCommand | undefined;
  private targetPath = '';
  private generation = 0;
  private abort = new AbortController();
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private applied: AdminInput | null = null;
  private contextToken = '';
  constructor() {
    effect(() => {
      const token = JSON.stringify([
        this.context()['connection_ref'] ?? null,
        this.locale.language(),
      ]);
      if (this.visible() && this.contextToken && token !== this.contextToken) {
        this.clear(false);
      }
      this.contextToken = token;
    });
    const release = inject(ActorState).register(() => this.clear(false));
    inject(DestroyRef).onDestroy(() => {
      this.clear(false);
      release();
    });
  }
  clear(restore = true): void {
    if (!restore) {
      this.returnFocus = null;
    }
    this.generation++;
    this.abort.abort();
    this.abort = new AbortController();
    clearTimeout(this.searchTimer);
    this.visible.set(false);
    this.rows.set([]);
    this.command = undefined;
    this.targetPath = '';
    this.search = '';
    this.error.set('');
    this.busy.set(false);
    this.page.set(1);
    this.pages.set(0);
    this.applied = null;
  }
  async open(request: { key: string; path: string }): Promise<void> {
    this.clear(false);
    const active = this.document.activeElement;
    this.returnFocus = active instanceof HTMLElement ? active : null;
    this.visible.set(true);
    this.targetPath = request.path;
    const actor = this.session.snapshot();
    const commands = (this.api?.groups() ?? [])
      .flatMap((group) => this.api?.commands(group.key) ?? [])
      .filter(
        (command) =>
          actor.status === 'authenticated' &&
          hasPermissions(actor.permissions, [command.permission]),
      );
    this.command = referenceCommand(request.key, commands, this.context());
    if (!this.command) {
      this.error.set(
        request.key === 'model_id' && !this.context()['connection_ref']
          ? 'Choose a connection first.'
          : 'No permitted operations.',
      );
      return;
    }
    await this.load();
  }
  restoreFocus(): void {
    if (!this.visible()) {
      const target = this.returnFocus;
      this.returnFocus = null;
      if (target?.isConnected) {
        target.focus();
      }
    }
  }
  async load(page = 1, size = this.size()): Promise<void> {
    const command = this.command;
    if (!command || !this.api) {
      return;
    }
    if (!this.permitted(command)) {
      this.rows.set([]);
      this.error.set('You do not have access to this action.');
      return;
    }
    const generation = ++this.generation;
    this.abort.abort();
    this.abort = new AbortController();
    clearTimeout(this.searchTimer);
    this.busy.set(true);
    this.rows.set([]);
    this.error.set('');
    const filters = ['user_ref_id', 'work_group_ref_id'].some((key) =>
      this.targetPath.endsWith(key),
    );
    const pagination = {
      page,
      size,
      ...(this.search
        ? filters
          ? {
              filters: [
                {
                  field_name: this.targetPath.endsWith('user_ref_id')
                    ? 'username'
                    : 'name',
                  operation: 'contains',
                  value: this.search,
                },
              ],
            }
          : { search: this.search }
        : {}),
    };
    const query =
      command.method === 'get'
        ? { ...pagination, response_format: 'page' }
        : { response_format: 'page' };
    try {
      const request: AdminInput = {
        body: command.method === 'get' ? {} : pagination,
        path: command.fields.path.length
          ? { connection_ref: String(this.context()['connection_ref']) }
          : {},
        query,
      };
      const response = await this.api.send(command, request, this.abort.signal);
      if (generation !== this.generation) {
        return;
      }
      this.rows.set(this.options(response.value));
      this.applied = structuredClone(request);
      this.page.set(response.page);
      this.pages.set(response.totalPages);
      this.size.set(size);
    } catch (error) {
      if (generation === this.generation) {
        this.error.set(
          error instanceof ApiFailure
            ? error.message
            : 'The service is unavailable.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  scheduleSearch(value: string): void {
    this.search = value;
    if (!this.command || !this.api) {
      return;
    }
    this.generation++;
    this.abort.abort();
    this.rows.set([]);
    this.busy.set(true);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.load(), 250);
  }
  private options(value: unknown): JsonObject[] {
    if (!Array.isArray(value)) {
      throw Error('Invalid selector response.');
    }
    return value.map((row) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        throw Error('Invalid selector response.');
      }
      const option = referenceChoice(row as JsonObject);
      return { ...option.row, key: option.key, value: option.label };
    });
  }
  private permitted(command: AdminCommand): boolean {
    const actor = this.session.snapshot();
    return (
      actor.status === 'authenticated' &&
      hasPermissions(actor.permissions, [command.permission])
    );
  }
  async choose(row: Record<string, unknown>): Promise<void> {
    const command = this.command;
    const request = this.applied;
    if (
      this.busy() ||
      !command ||
      !request ||
      !this.api ||
      !this.rows().includes(row as JsonObject)
    ) {
      return;
    }
    if (!this.permitted(command)) {
      this.rows.set([]);
      this.error.set('You do not have access to this action.');
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    try {
      const key = referenceChoice(row as JsonObject).key;
      const response = await this.api.send(
        command,
        structuredClone(request),
        this.abort.signal,
      );
      if (generation !== this.generation) {
        return;
      }
      const current = this.permitted(command)
        ? this.options(response.value).find((option) => option['key'] === key)
        : undefined;
      if (!current) {
        this.rows.set([]);
        this.error.set('The selected resource is unavailable. Choose again.');
        return;
      }
      const choice = referenceChoice(current);
      this.picked.emit({
        path: this.targetPath,
        value: choice.key,
        label: choice.label,
      });
      this.clear();
    } catch (error) {
      if (generation === this.generation) {
        this.rows.set([]);
        this.error.set(
          error instanceof ApiFailure
            ? error.message
            : 'The service is unavailable.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
