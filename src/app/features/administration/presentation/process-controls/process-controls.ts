import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ActorState } from '../../../../core/auth/actor-state';
import { SessionContext } from '../../../../core/auth/session-context';
import { hasPermissions } from '../../../../core/permissions/area-access';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { RecordSummary } from '../../../../shared/ui/record-summary/record-summary';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { ADMIN_API } from '../../bindings';
import { ResourceActions } from '../resource-actions/resource-actions';

@Component({
  selector: 'app-process-controls',
  host: { class: 'console-page' },
  imports: [
    FormsModule,
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
    if (!((await this.actions()?.canLeave()) ?? true)) {
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
      if (
        !result.value ||
        typeof result.value !== 'object' ||
        Array.isArray(result.value)
      ) {
        throw Error('Invalid process response');
      }
      this.row.set({ ...(result.value as JsonObject), ref_id: target });
      this.currentReference = target;
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
  async refresh(): Promise<void> {
    this.notice.set('Command accepted. Checking current state.');
    await this.load(this.currentReference);
  }
}
