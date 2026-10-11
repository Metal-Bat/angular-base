import { record } from '../../../core/transport/api-failure';
import { AIEvidence, OrderEvidence } from '../domain/process-evidence';
import { stringField } from './workspace-decoders';

function nullableText(value: unknown): string | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw Error('Invalid evidence');
  }
  return value;
}
function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw Error('Invalid evidence');
  }
  return value;
}
export function orderEvidence(value: unknown): OrderEvidence {
  const item = record(value);
  const state = item['state'];
  if (
    !['PREPARED', 'DISPATCHING', 'UNKNOWN', 'CONFIRMED'].includes(String(state))
  ) {
    throw Error('Invalid order state');
  }
  const operation = stringField(item, 'operation_id');
  const receipt =
    item['receipt'] === null || item['receipt'] === undefined
      ? null
      : record(item['receipt']);
  if (
    receipt &&
    (state !== 'CONFIRMED' ||
      receipt['operation_id'] !== operation ||
      !['CREATED', 'CANCELLED'].includes(String(receipt['state'])) ||
      !/^[a-f0-9]{64}$/.test(stringField(receipt, 'payload_hash')))
  ) {
    throw Error('Invalid order receipt');
  }
  return {
    operation,
    execution: stringField(item, 'step_execution_ref_id'),
    state: state as OrderEvidence['state'],
    receipt: receipt
      ? {
          identity: stringField(receipt, 'receipt_id'),
          state: receipt['state'] as 'CREATED' | 'CANCELLED',
          payloadHash: stringField(receipt, 'payload_hash'),
        }
      : null,
  };
}
function recommendation(value: unknown): AIEvidence['recommendation'] {
  if (value === null) {
    return null;
  }
  const item = record(value);
  const confidence = item['confidence'];
  if (
    typeof confidence !== 'number' ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1
  ) {
    throw Error('Invalid confidence');
  }
  return {
    choice: stringField(item, 'choice'),
    confidence,
    needsReview: boolean(item['needs_review']),
  };
}
function budget(value: unknown): AIEvidence['budget'] {
  if (value === null) {
    return null;
  }
  const item = record(value);
  const spend = (key: string): string => {
    const text = stringField(record(item[key]), 'spend_usd');
    if (!/^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(text)) {
      throw Error('Invalid budget');
    }
    return text;
  };
  return {
    currency: stringField(item, 'currency'),
    priceVersion: stringField(item, 'price_version'),
    unknown: boolean(item['unknown_usage']),
    used: spend('used'),
    reserved: spend('reserved'),
    remaining: spend('remaining'),
  };
}
export function aiEvidence(value: unknown): AIEvidence {
  const item = record(value);
  const attempt = item['attempt_number'];
  const fields = item['allowed_input_fields'];
  if (
    !Number.isSafeInteger(attempt) ||
    Number(attempt) < 1 ||
    !Array.isArray(fields) ||
    !fields.every((field) => typeof field === 'string')
  ) {
    throw Error('Invalid AI evidence');
  }
  return {
    execution: stringField(item, 'step_execution_ref_id'),
    attempt: Number(attempt),
    status: stringField(item, 'status'),
    agent: nullableText(item['agent_ref_id']),
    agentAvailable: boolean(item['agent_available']),
    model: nullableText(item['model_id']),
    fields,
    recommendation: recommendation(item['recommendation']),
    budget: budget(item['budget']),
  };
}
