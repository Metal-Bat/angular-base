import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { ORDER_RECOVERY } from '../../bindings';
import { RecoveryCommand } from '../../domain/order-recovery';
import { EvidencePage, OrderEvidence } from '../../domain/process-evidence';

@Component({
  selector: 'app-order-recovery',
  imports: [
    FormsModule,
    ButtonDirective,
    InputText,
    ControlField,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './order-recovery.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderRecovery {
  readonly reference = input.required<string>();
  readonly orders = input<EvidencePage<OrderEvidence> | null>(null);
  readonly reconciled = output<void>();
  private readonly port = inject(ORDER_RECOVERY);
  private readonly actor = inject(ActorState);
  private readonly feedback = inject(Feedback);
  private readonly controller = new AbortController();
  readonly allowed = signal(false);
  readonly busy = signal(false);
  readonly message = signal('');
  readonly uncertain = signal(false);
  readonly frozen = signal<RecoveryCommand | null>(null);
  readonly operation = signal('');
  readonly reason = signal('');
  readonly valid = computed(
    () =>
      !!this.operation() &&
      /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/.test(this.reason()),
  );
  private generation = 0;
  constructor() {
    const clear = (): void => {
      this.generation++;
      this.controller.abort();
      this.allowed.set(false);
      this.busy.set(false);
      this.message.set('');
      this.frozen.set(null);
      this.uncertain.set(false);
      this.operation.set('');
      this.reason.set('');
    };
    const unregister = this.actor.register(clear);
    inject(DestroyRef).onDestroy(() => {
      clear();
      unregister();
    });
    void this.resolveAuthority();
  }
  private async resolveAuthority(): Promise<void> {
    try {
      const allowed = await this.port.authority(this.controller.signal);
      if (!this.controller.signal.aborted) {
        this.allowed.set(allowed);
      }
    } catch {
      this.allowed.set(false);
    }
  }
  async canLeave(): Promise<boolean> {
    if (this.busy()) {
      return false;
    }
    return (
      !(this.reason() || this.frozen()) ||
      this.feedback.confirm(
        'Discard unsaved recovery input? An unknown outcome still requires investigation.',
      )
    );
  }
  async lookup(kind: RecoveryCommand['kind']): Promise<void> {
    if (!this.allowed() || this.busy() || !this.valid() || this.frozen()) {
      return;
    }
    const generation = this.generation;
    this.busy.set(true);
    this.message.set('');
    try {
      const command = await this.port.prepare(
        this.reference(),
        this.operation(),
        this.orders()?.page ?? 1,
        this.reason(),
        kind,
        this.controller.signal,
      );
      if (!this.current(generation)) {
        return;
      }
      const approved = await this.feedback.confirm(
        'Look up the recorded outcome? No new order is created. Existing cancellation work may be queued.',
      );
      if (!approved || !this.current(generation)) {
        return;
      }
      this.frozen.set(command);
      await this.send(command, generation);
    } catch {
      if (this.current(generation)) {
        this.message.set(
          'Recovery could not be prepared. Refresh the evidence and check current access.',
        );
      }
    } finally {
      if (this.current(generation)) {
        this.busy.set(false);
      }
    }
  }
  async reconcileOriginal(): Promise<void> {
    const command = this.frozen();
    if (!command || !this.uncertain() || this.busy() || !this.allowed()) {
      return;
    }
    const generation = this.generation;
    this.busy.set(true);
    try {
      await this.send(command, generation);
    } finally {
      if (this.current(generation)) {
        this.busy.set(false);
      }
    }
  }
  private current(generation: number): boolean {
    return generation === this.generation && !this.controller.signal.aborted;
  }
  private async send(
    command: RecoveryCommand,
    generation: number,
  ): Promise<void> {
    try {
      const result = await this.port.execute(command, this.controller.signal);
      if (!this.current(generation)) {
        return;
      }
      this.uncertain.set(false);
      this.frozen.set(null);
      this.reason.set('');
      this.message.set(
        result.kind === 'order' && result.order.receipt
          ? 'Provider receipt confirmed. Review the refreshed evidence.'
          : result.kind === 'cancellation'
            ? 'Cancellation recovery was recorded. Queued work is not confirmed cancellation.'
            : 'No confirmed receipt was found. Do not repeat the order.',
      );
      this.reconciled.emit();
    } catch (error) {
      if (!this.current(generation)) {
        return;
      }
      const unknown =
        !(error instanceof ApiFailure) ||
        error.uncertain ||
        error.httpStatus === 0 ||
        error.httpStatus >= 500;
      this.uncertain.set(unknown);
      if (!unknown) {
        this.frozen.set(null);
      }
      this.message.set(
        unknown
          ? 'Recovery outcome is unknown. Check current evidence or reconcile the original command.'
          : 'Recovery was rejected. Check current authorization and eligible execution state.',
      );
    }
  }
}
