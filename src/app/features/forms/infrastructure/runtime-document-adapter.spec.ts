import { readRuntimeDocument } from './runtime-document-adapter';
import { readPinnedRequest } from '../application/runtime-document-reader';
import { rendererCapabilities } from '../domain/runtime-document';
function fixture(): Record<string, unknown> {
  return {
    runtime_dialect: 'bpms.runtime/1',
    resource_kind: 'WORK_ITEM',
    resource_ref_id: 'opaque/current',
    form_version_ref_id: 'opaque/pinned',
    form_version_number: 2,
    submission_ref_id: 'opaque/submission',
    design_key: 'client-original',
    render_dialect: 'bpms.render/1',
    data_dialect: 'https://json-schema.org/draft/2020-12/schema',
    view_key: 'review',
    purpose: 'edit',
    resolved_locale: 'en',
    direction: 'ltr',
    data: { amount: '125.00' },
    before_data: null,
    item_identity: {},
    page_settings: {},
    render_schema: {
      dialect: 'bpms.render/1',
      root: { component: 'text', scope: '/properties/amount', label: 'Amount' },
    },
    readable_scopes: ['/properties/amount'],
    writable_scopes: ['/properties/amount'],
    required_scopes: ['/properties/amount'],
    field_metadata: [
      {
        scope: '/properties/amount',
        validation_schema: { type: 'string' },
        writable: true,
        required: true,
      },
    ],
    actions: [],
    override_provenance: {},
    issues: [],
  };
}
describe('Actor-filtered runtime conformance', () => {
  it('keeps canonical values, policy, identity, render and schema separate and immutable', () => {
    const input = fixture();
    const result = readRuntimeDocument(input);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') {
      return;
    }
    expect(result.document.identity).toMatchObject({
      formVersion: 'opaque/pinned',
      design: 'client-original',
    });
    expect(result.document.canonical).toEqual({ amount: '125.00' });
    expect(result.document.render.component).toBe('text');
    expect(Object.isFrozen(result.document.canonical)).toBe(true);
    (input['data'] as Record<string, unknown>)['amount'] = 'changed outside';
    expect(result.document.canonical['amount']).toBe('125.00');
  });
  it.each(['observer', 'summary', 'print'])(
    'accepts an authorized readonly %s context without command controls',
    (purpose) => {
      const input = fixture();
      input['purpose'] = purpose;
      input['writable_scopes'] = [];
      input['field_metadata'] = [
        {
          scope: '/properties/amount',
          validation_schema: { type: 'string' },
          writable: false,
          required: true,
        },
      ];
      expect(readRuntimeDocument(input).status).toBe('ready');
      input['writable_scopes'] = ['/properties/amount'];
      expect(readRuntimeDocument(input)).toEqual({
        status: 'invalid',
        reason: 'policy',
      });
    },
  );
  it('preserves prior correction data and translated labels without changing canonical values or pins', () => {
    const input = fixture();
    input['purpose'] = 'correction';
    input['before_data'] = { amount: '100.00' };
    input['resolved_locale'] = 'fa';
    input['direction'] = 'rtl';
    input['render_schema'] = {
      dialect: 'bpms.render/1',
      root: { component: 'text', scope: '/properties/amount', label: 'مبلغ' },
    };
    const result = readRuntimeDocument(input);
    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.document.canonical).toEqual({ amount: '125.00' });
      expect(result.document.before).toEqual({ amount: '100.00' });
      expect(result.document.render.label).toBe('مبلغ');
    }
  });
  it('rejects repinning to a changed latest definition both at the adapter and application boundary', async () => {
    const pin = {
      formVersion: 'original',
      versionNumber: 1,
      design: 'original',
    };
    expect(readRuntimeDocument(fixture(), pin)).toEqual({
      status: 'invalid',
      reason: 'pin',
    });
    const result = await readPinnedRequest(
      {
        task: async () => readRuntimeDocument(fixture()),
        request: async () => readRuntimeDocument(fixture()),
      },
      'current',
      pin,
    );
    expect(result).toEqual({ status: 'invalid', reason: 'pin' });
  });
  it.each(['bpms.runtime/99', 'unknown'])(
    'returns compatibility for unsupported runtime %s',
    (dialect) => {
      const input = fixture();
      input['runtime_dialect'] = dialect;
      expect(readRuntimeDocument(input)).toEqual({
        status: 'unsupported',
        reason: 'dialect',
      });
    },
  );
  it('rejects unknown primitives, missing metadata and hidden render bindings without synthesizing values', () => {
    const input = fixture();
    input['render_schema'] = {
      dialect: 'bpms.render/1',
      root: { component: 'execute-script' },
    };
    expect(readRuntimeDocument(input)).toEqual({
      status: 'unsupported',
      reason: 'primitive',
    });
    input['render_schema'] = {
      dialect: 'bpms.render/1',
      root: { component: 'text', scope: '/properties/secret' },
    };
    expect(readRuntimeDocument(input)).toEqual({
      status: 'invalid',
      reason: 'policy',
    });
    input['render_schema'] = {
      dialect: 'bpms.render/1',
      root: { component: 'text', scope: '/properties/amount' },
    };
    input['field_metadata'] = [];
    expect(readRuntimeDocument(input)).toEqual({
      status: 'invalid',
      reason: 'policy',
    });
    input['field_metadata'] = fixture()['field_metadata'];
    input['data'] = {};
    const result = readRuntimeDocument(input);
    if (result.status === 'ready') {
      expect(result.document.canonical).toEqual({});
    }
    expect(rendererCapabilities).toContain('primitive.text/1');
    expect(rendererCapabilities).toContain('primitive.media/1');
  });
  it('does not execute or retain authoring calculations, navigation or defaults', () => {
    const input = fixture();
    input['render_schema'] = {
      dialect: 'bpms.render/1',
      root: { component: 'text', calculation: { expression: 'secret' } },
    };
    expect(readRuntimeDocument(input)).toEqual({
      status: 'invalid',
      reason: 'policy',
    });
  });
  it('accepts nested bindings beneath an authorized parent and rejects unadvertised capability requirements', () => {
    const input = fixture();
    input['render_schema'] = {
      dialect: 'bpms.render/1',
      root: {
        component: 'group',
        scope: '/properties/amount',
        children: [
          {
            component: 'text',
            scope: '/properties/amount/properties/currency',
          },
        ],
      },
    };
    expect(readRuntimeDocument(input).status).toBe('ready');
    input['render_schema'] = {
      dialect: 'bpms.render/1',
      root: {
        component: 'text',
        interaction: { required_capabilities: ['custom/1'] },
      },
    };
    expect(readRuntimeDocument(input)).toEqual({
      status: 'unsupported',
      reason: 'capability',
    });
  });
  it('fails closed for cyclic and oversized dynamic documents', () => {
    const input = fixture();
    input['data'] = { self: input };
    expect(readRuntimeDocument(input)).toEqual({
      status: 'invalid',
      reason: 'shape',
    });
  });
});
