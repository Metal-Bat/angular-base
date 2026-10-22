import { hasActiveSubprocess } from '../../domain/action-availability';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ActorState } from '../../../../core/auth/actor-state';
import { SessionContext } from '../../../../core/auth/session-context';
import { hasPermissions } from '../../../../core/permissions/area-access';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { RecordSummary } from '../../../../shared/ui/record-summary/record-summary';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { ADMIN_API } from '../../bindings';
import { ResourceActions } from '../resource-actions/resource-actions';

@Component({
  selector: 'app-process-controls',
  host: { class: 'console-page' },
  imports: [
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    InputTextModule,
    ControlField,
    LocalizePipe,
    RecordSummary,
    ResourceActions,
  ],
  templateUrl: './process-controls.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessControls {
  private readonly api = inject(ADMIN_API);
  private readonly session = inject(SessionContext);
  private generation = 0;
  readonly actions = viewChild(ResourceActions);
  readonly busy = signal(false);
  readonly row = signal<JsonObject | null>(null);
  readonly sections = [
    {
      title: 'Lifecycle',
      keys: ['status', 'started_at', 'ended_at', 'last_error_code'],
    },
  ];
  readonly positions = computed(() => {
    const value = this.row()?.['current_positions'];
    return Array.isArray(value)
      ? value.filter(
          (position): position is JsonObject =>
            !!position &&
            typeof position === 'object' &&
            !Array.isArray(position),
        )
      : [];
  });
  readonly waitingForChild = computed(() =>
    hasActiveSubprocess(this.row() ?? {}),
  );
  readonly requestReference = computed(() => {
    const value = this.row()?.['business_request_ref_id'];
    return typeof value === 'string' ? value : null;
  });
  readonly error = signal('');
  readonly notice = signal('');
  readonly canRead = computed(() => {
    const actor = this.session.snapshot();
    return (
      actor.status === 'authenticated' &&
      hasPermissions(actor.permissions, ['requests.start'])
    );
  });
  readonly allowed = computed(() => {
    const actor = this.session.snapshot();
    return (
      this.canRead() ||
      (actor.status === 'authenticated' &&
        hasPermissions(actor.permissions, ['processes.recover']))
    );
  });
  reference = inject(ActivatedRoute).snapshot.queryParamMap.get('ref_id') ?? '';
  private currentReference = '';
  constructor() {
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
    if (this.reference) {
      void this.load();
    }
  }
  private clear(): void {
    this.generation++;
    this.reference = '';
    this.currentReference = '';
    this.row.set(null);
    this.error.set('');
    this.notice.set('');
    this.busy.set(false);
  }
  async canLeave(): Promise<boolean> {
    return !this.busy() && ((await this.actions()?.canLeave()) ?? true);
  }
  async load(reference = this.reference): Promise<void> {
    if (this.busy() || !this.allowed()) {
      return;
    }
    const beforeLeave = this.generation;
    if (
      !((await this.actions()?.canLeave()) ?? true) ||
      beforeLeave !== this.generation ||
      !this.allowed() ||
      this.busy()
    ) {
      return;
    }
    const target = reference.trim();
    if (!target) {
      this.error.set('Choose a process reference.');
      return;
    }
    if (!this.canRead()) {
      this.row.set({ ref_id: target });
      this.currentReference = target;
      return;
    }
    const command = this.api
      .commands('processes')
      .find(
        (item) =>
          item.method === 'get' && item.path === '/api/v1/processes/{ref_id}',
      );
    if (!command) {
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.api.send(command, {
        path: { ref_id: target },
        body: {},
        query: {},
      });
      if (generation !== this.generation) {
        return;
      }
      this.acceptCurrent(result.value);
    } catch (error) {
      if (generation === this.generation) {
        this.error.set(
          error instanceof ApiFailure
            ? error.message
            : 'The service is unavailable. Your current view has been retained.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  private acceptCurrent(value: JsonValue): void {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw Error('Invalid process response');
    }
    const record = value as JsonObject;
    if (typeof record['ref_id'] !== 'string' || !record['ref_id'].trim()) {
      throw Error('Missing current process reference');
    }
    this.row.set(record);
    this.currentReference = record['ref_id'];
    this.reference = this.currentReference;
  }
  async refresh(): Promise<void> {
    this.notice.set('Command accepted. Checking current state.');
    await this.load(this.currentReference);
  }
}
