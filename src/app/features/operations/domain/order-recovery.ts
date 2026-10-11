import { OrderEvidence } from './process-evidence';
export type RecoveryCommand = {
  readonly operation: string;
  readonly process: string;
  readonly execution: string;
  readonly commandKey: string;
  readonly reason: string;
  readonly kind: 'order' | 'cancellation';
};
export type RecoveryResult =
  | { readonly kind: 'order'; readonly order: OrderEvidence }
  | {
      readonly kind: 'cancellation';
      readonly status: string;
      readonly execution: string;
    };
export type OrderRecoveryPort = {
  authority(abort: AbortSignal): Promise<boolean>;
  prepare(
    reference: string,
    operation: string,
    page: number,
    reason: string,
    kind: RecoveryCommand['kind'],
    abort: AbortSignal,
  ): Promise<RecoveryCommand>;
  execute(
    command: RecoveryCommand,
    abort: AbortSignal,
  ): Promise<RecoveryResult>;
};
