/** Authorized registered metadata; configuration never establishes execution authority. */
export type BusinessOperation = {
  key: string;
  handler: string;
  version: string;
  scopes: readonly ('NORMAL' | 'COMPENSATION')[];
  providers: readonly string[];
  approvalPolicy: string | null;
  businessEffect: boolean;
  retryPolicy: 'diagnostic_retry' | 'reconcile_before_retry';
  reconciliation: 'receipt_lookup' | null;
};
