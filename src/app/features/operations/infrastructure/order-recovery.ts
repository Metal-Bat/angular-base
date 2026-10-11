import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionContext } from '../../../core/auth/session-context';
import { hasPermissions } from '../../../core/permissions/area-access';
import { ApiClient } from '../../../core/transport/api-client';
import { record } from '../../../core/transport/api-failure';
import {
  readData,
  readResultPage,
} from '../../../core/transport/response-adapters';
import {
  OrderRecoveryPort,
  RecoveryCommand,
  RecoveryResult,
} from '../domain/order-recovery';
import { orderEvidence } from './process-evidence-decoder';
import { stringField } from './workspace-decoders';

@Injectable({ providedIn: 'root' })
export class OrderRecoveryApi implements OrderRecoveryPort {
  private readonly api = inject(ApiClient);
  private readonly session = inject(SessionContext);
  async authority(abort: AbortSignal): Promise<boolean> {
    const session = this.session.snapshot();
    if (
      session.status !== 'authenticated' ||
      !hasPermissions(session.permissions, ['processes.recover'])
    ) {
      return false;
    }
    const operator = readData(
      await firstValueFrom(this.api.call('me_api_v1_auth_me_get', {}, abort)),
      (value) => record(value)['is_superuser'] === true,
    );
    return !abort.aborted && operator;
  }
  async prepare(
    reference: string,
    operation: string,
    page: number,
    reason: string,
    kind: RecoveryCommand['kind'],
    abort: AbortSignal,
  ): Promise<RecoveryCommand> {
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/.test(reason)) {
      throw Error('Invalid incident');
    }
    const [process, orders] = await Promise.all([
      firstValueFrom(
        this.api.call(
          'get_process_api_v1_processes__ref_id__get',
          { path: { ref_id: reference } },
          abort,
        ),
      ),
      firstValueFrom(
        this.api.call(
          'search_sandbox_orders_api_v1_processes__ref_id__orders_search_post',
          { path: { ref_id: reference }, body: { page, size: 20 } },
          abort,
        ),
      ),
    ]);
    const current = readResultPage(orders, orderEvidence).items.find(
      (item) => item.operation === operation,
    );
    if (!current || abort.aborted) {
      throw Error('Order evidence changed');
    }
    return Object.freeze({
      operation,
      process: readData(process, (value) =>
        stringField(record(value), 'ref_id'),
      ),
      execution: current.execution,
      commandKey: crypto.randomUUID(),
      reason,
      kind,
    });
  }
  async execute(
    command: RecoveryCommand,
    abort: AbortSignal,
  ): Promise<RecoveryResult> {
    if (!(await this.authority(abort))) {
      throw Error('Recovery authority unavailable');
    }
    const body = {
      command_key: command.commandKey,
      reason: command.reason,
      step_execution_ref_id: command.execution,
    };
    if (command.kind === 'order') {
      const order = readData(
        await firstValueFrom(
          this.api.call(
            'reconcile_sandbox_order_api_v1_processes__ref_id__orders_reconcile_post',
            { path: { ref_id: command.process }, body },
            abort,
          ),
        ),
        orderEvidence,
      );
      if (order.operation !== command.operation) {
        throw Error('Recovery operation changed');
      }
      return { kind: 'order', order };
    }
    return readData(
      await firstValueFrom(
        this.api.call(
          'reconcile_sandbox_cancellation_api_v1_processes__ref_id__orders_reconcile_cancellation_post',
          { path: { ref_id: command.process }, body },
          abort,
        ),
      ),
      (value) => {
        const item = record(value);
        return {
          kind: 'cancellation',
          status: stringField(item, 'status'),
          execution: stringField(item, 'step_execution_ref_id'),
        };
      },
    );
  }
}
