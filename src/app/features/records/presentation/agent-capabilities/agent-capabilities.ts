import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { AGENT_METADATA } from '../../bindings';
import {
  AgentModel,
  AgentProvider,
} from '../../application/agent-metadata-port';
@Component({
  selector: 'app-agent-capabilities',
  imports: [ButtonDirective, LocalizePipe],
  templateUrl: './agent-capabilities.html',
  styleUrl: './agent-capabilities.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentCapabilities {
  readonly config = input.required<JsonObject>();
  private readonly api = inject(AGENT_METADATA);
  readonly provider = signal<AgentProvider | null>(null);
  readonly model = signal<AgentModel | null>(null);
  readonly busy = signal(false);
  readonly unavailable = signal(false);
  private generation = 0;
  readonly selection = computed(() =>
    JSON.stringify(
      ['provider_key', 'connection_ref', 'model_id'].map((key) =>
        String(this.config()[key] ?? ''),
      ),
    ),
  );
  constructor() {
    effect(() => {
      this.selection();
      untracked(() => {
        void this.load();
      });
    });
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
  }
  private clear(): void {
    this.generation++;
    this.provider.set(null);
    this.model.set(null);
    this.busy.set(false);
    this.unavailable.set(false);
  }
  async load(): Promise<void> {
    this.clear();
    const generation = this.generation;
    const [provider, connection, model] = JSON.parse(
      this.selection(),
    ) as string[];
    if (!provider || !connection || !model) {
      return;
    }
    this.busy.set(true);
    const results = await Promise.allSettled([
      this.api.provider(provider),
      this.api.model(connection, model),
    ]);
    if (generation !== this.generation) {
      return;
    }
    if (results[0].status === 'fulfilled') {
      this.provider.set(results[0].value);
    }
    if (results[1].status === 'fulfilled') {
      this.model.set(results[1].value);
    }
    this.unavailable.set(
      results.some((result) => result.status === 'rejected'),
    );
    this.busy.set(false);
  }
}
