import { record } from '../../../core/transport/api-failure';
import type { components } from '../../../core/transport/generated/schema';
import { BusinessOperation } from '../domain/business-operation';
/** Fixed DTO fields map explicitly to the inspector's metadata-only model. */
export function operationCatalog(value: unknown): BusinessOperation[] {
  if (!Array.isArray(value) || value.length > 100) {
    throw Error('Invalid operation catalog');
  }
  return value.map((item) => {
    const row = record(item) as components['schemas']['BusinessOperationDTO'];
    if (
      !row.operation_key ||
      typeof row.operation_key !== 'string' ||
      typeof row.handler_key !== 'string' ||
      typeof row.handler_version !== 'string' ||
      !Array.isArray(row.execution_scopes) ||
      !row.execution_scopes.every((scope) =>
        ['NORMAL', 'COMPENSATION'].includes(scope),
      ) ||
      !Array.isArray(row.allowed_providers) ||
      !row.allowed_providers.every(
        (provider) => typeof provider === 'string',
      ) ||
      (row.approval_policy !== null &&
        typeof row.approval_policy !== 'string') ||
      typeof row.has_business_effect !== 'boolean' ||
      !['diagnostic_retry', 'reconcile_before_retry'].includes(
        row.retry_policy,
      ) ||
      (row.reconciliation !== null && row.reconciliation !== 'receipt_lookup')
    ) {
      throw Error('Invalid operation catalog');
    }
    return {
      key: row.operation_key,
      handler: row.handler_key,
      version: row.handler_version,
      scopes: row.execution_scopes,
      providers: row.allowed_providers,
      approvalPolicy: row.approval_policy,
      businessEffect: row.has_business_effect,
      retryPolicy: row.retry_policy,
      reconciliation: row.reconciliation,
    };
  });
}
