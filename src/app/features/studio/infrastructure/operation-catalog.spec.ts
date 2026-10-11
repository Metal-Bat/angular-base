import { operationCatalog } from './operation-catalog';
it('projects registered metadata without private extras and rejects malformed catalogs', () => {
  const row = {
    operation_key: 'sandbox.order.create/1',
    handler_key: 'service_task',
    handler_version: '1',
    execution_scopes: ['NORMAL'],
    allowed_providers: ['sandbox'],
    approval_policy: 'purchase-human-approval/1',
    has_business_effect: true,
    retry_policy: 'reconcile_before_retry',
    reconciliation: 'receipt_lookup',
    private_extra: 'never expose',
  };
  const operations = operationCatalog([row]);
  expect(operations[0]).toMatchObject({
    key: row.operation_key,
    approvalPolicy: row.approval_policy,
    businessEffect: true,
  });
  expect(JSON.stringify(operations)).not.toContain('private_extra');
  expect(() =>
    operationCatalog([{ ...row, execution_scopes: ['UNSUPPORTED'] }]),
  ).toThrow('Invalid');
  expect(() =>
    operationCatalog([{ ...row, has_business_effect: 'true' }]),
  ).toThrow('Invalid');
});
