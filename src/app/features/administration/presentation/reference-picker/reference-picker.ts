import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
import { hasPermissions } from '../../../../core/permissions/area-access';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { RecordTable } from '../../../../shared/ui/record-table/record-table';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { emptyQuery } from '../../../../shared/domain/list-query';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { ADMIN_API } from '../../bindings';
import { AdminCommand } from '../../domain/admin-command';
import { referenceCommand } from '../../domain/reference-options';
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
  constructor() {
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
  }
  clear(): void {
    this.generation++;
    this.visible.set(false);
    this.rows.set([]);
    this.command = undefined;
    this.targetPath = '';
    this.search = '';
    this.error.set('');
    this.busy.set(false);
  }
  async open(request: { key: string; path: string }): Promise<void> {
    this.clear();
    this.visible.set(true);
    this.targetPath = request.path;
    const actor = this.session.snapshot();
    const commands = ['users', 'groups', 'agents', 'tasks']
      .flatMap((group) => this.api?.commands(group) ?? [])
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
  async load(page = 1, size = this.size()): Promise<void> {
    const command = this.command;
    if (!command || !this.api) {
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
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
      const response = await this.api.send(command, {
        body: command.method === 'get' ? {} : pagination,
        path: command.fields.path.length
          ? { connection_ref: String(this.context()['connection_ref']) }
          : {},
        query,
      });
      if (generation !== this.generation) {
        return;
      }
      this.rows.set(
        Array.isArray(response.value) ? (response.value as JsonObject[]) : [],
      );
      this.page.set(response.page);
      this.pages.set(response.totalPages);
      this.size.set(size);
    } catch {
      if (generation === this.generation) {
        this.error.set('The service is unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  choose(row: Record<string, unknown>): void {
    if (this.busy()) {
      return;
    }
    this.picked.emit({
      path: this.targetPath,
      value: String(row['key'] ?? row['ref_id'] ?? row['name']),
      label: String(row['value'] ?? row['name'] ?? row['key']),
    });
    this.clear();
  }
}
