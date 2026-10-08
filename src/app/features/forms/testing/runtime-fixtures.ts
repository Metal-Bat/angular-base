// Versioned synthetic data. Hidden sentinel values are test-only and never placed in a visible document.
export const fixtureVersion = 'bpms.runtime/1';
export const fixtureCorpusVersion = 'workspace-fixtures/1';
export const publishedDefinition = {
  form_version_ref_id: 'opaque/pinned',
  form_version_number: 2,
  workflow_version_ref_id: 'workflow/pinned',
  status: 'PUBLISHED',
} as const;
export const actors = {
  requester: ['requests.start'],
  reviewer: ['requests.start'],
  author: ['forms.manage'],
  administrator: ['admin.users.manage'],
  outsider: [],
} as const;
export function runtimeFixture(
  kind: 'REQUEST' | 'WORK_ITEM' = 'WORK_ITEM',
): Record<string, unknown> {
  return {
    runtime_dialect: fixtureVersion,
    resource_kind: kind,
    resource_ref_id: 'opaque/current',
    form_version_ref_id: 'opaque/pinned',
    form_version_number: 2,
    submission_ref_id: 'opaque/submission',
    design_key: 'original',
    render_dialect: 'bpms.render/1',
    data_dialect: 'https://json-schema.org/draft/2020-12/schema',
    view_key: kind === 'REQUEST' ? 'request' : 'review',
    purpose: 'edit',
    resolved_locale: 'en',
    direction: 'ltr',
    data: {
      amount: 125,
      decimal: '12345678901234567890.123456789',
      approved: false,
      choice: 1,
    },
    before_data: null,
    item_identity: {},
    page_settings: {},
    render_schema: {
      dialect: 'bpms.render/1',
      root: {
        component: 'vertical',
        children: [
          { component: 'number', scope: '/properties/amount', label: 'Amount' },
          {
            component: 'text',
            scope: '/properties/decimal',
            label: 'Exact decimal',
          },
          {
            component: 'boolean',
            scope: '/properties/approved',
            label: 'Approved',
          },
          { component: 'choice', scope: '/properties/choice', label: 'Choice' },
        ],
      },
    },
    readable_scopes: [
      '/properties/amount',
      '/properties/decimal',
      '/properties/approved',
      '/properties/choice',
    ],
    writable_scopes: [
      '/properties/amount',
      '/properties/decimal',
      '/properties/approved',
      '/properties/choice',
    ],
    required_scopes: ['/properties/amount'],
    field_metadata: [
      {
        scope: '/properties/amount',
        validation_schema: { type: 'number', minimum: 0 },
        writable: true,
        required: true,
      },
      {
        scope: '/properties/decimal',
        validation_schema: { type: ['string', 'null'] },
        writable: true,
        required: false,
      },
      {
        scope: '/properties/approved',
        validation_schema: { type: 'boolean' },
        writable: true,
        required: false,
      },
      {
        scope: '/properties/choice',
        validation_schema: { type: 'integer', enum: [1, 2] },
        writable: true,
        required: false,
      },
    ],
    actions: [
      {
        key: 'approve',
        kind: 'complete',
        outcome_key: 'APPROVE',
        title: 'Approve',
        confirmation: null,
        required_scopes: ['/properties/amount'],
        require_comment: false,
        validation: 'complete',
      },
    ],
    override_provenance: {},
    issues: [],
  };
}
export const machineStates = {
  request: [
    'DRAFT',
    'SUBMITTED',
    'RUNNING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
  ],
  workItem: [
    'OPEN',
    'CLAIMED',
    'IN_PROGRESS',
    'COMPLETED',
    'REJECTED',
    'RETURNED',
    'CANCELLED',
    'EXPIRED',
  ],
  process: [
    'RUNNING',
    'WAITING',
    'PAUSED',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'COMPENSATING',
    'COMPENSATION_FAILED',
    'COMPENSATED',
  ],
} as const;
export function collectionFixture(): Record<string, unknown> {
  const fixture = runtimeFixture();
  fixture['data'] = {
    ...(fixture['data'] as Record<string, unknown>),
    rows: [{ title: 'First' }, { title: 'Second' }],
    attachments: ['opaque/private-file'],
  };
  fixture['item_identity'] = { '/rows': ['row-a', 'row-b'] };
  fixture['before_data'] = { rows: [{ title: 'Prior' }] };
  return fixture;
}

export function contextFixture(
  purpose: 'edit' | 'summary' | 'print' | 'observer' | 'correction',
): Record<string, unknown> {
  const fixture = runtimeFixture();
  fixture['purpose'] = purpose;
  fixture['view_key'] = purpose;
  if (['summary', 'print', 'observer'].includes(purpose)) {
    fixture['writable_scopes'] = [];
    fixture['actions'] = [];
    fixture['field_metadata'] = (
      fixture['field_metadata'] as Record<string, unknown>[]
    ).map((field) => ({ ...field, writable: false }));
  }
  if (purpose === 'correction') {
    fixture['before_data'] = {
      amount: 100,
      decimal: '12345678901234567890.123456789',
      approved: false,
      choice: 1,
    };
  }
  return fixture;
}
export function taskFixture(
  kind: 'HUMAN_TASK' | 'AI_APPROVAL' | 'UNSUPPORTED',
  status = 'OPEN',
): Record<string, unknown> {
  return {
    ref_id: 'task/synthetic',
    kind,
    status,
    form_version_ref_id: kind === 'HUMAN_TASK' ? 'opaque/pinned' : null,
    claimant_ref_id: null,
    process_ref_id: 'process/synthetic',
    workflow_version_ref_id: 'workflow/pinned',
  };
}
