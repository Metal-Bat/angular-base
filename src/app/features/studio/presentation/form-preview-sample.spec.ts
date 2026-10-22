import { computed, signal } from '@angular/core';
import {
  JsonObject,
  RuntimeCompatibility,
} from '../../forms/domain/runtime-document';
import { readRuntimeDocument } from '../../forms/infrastructure/runtime-document-adapter';
import { runtimeFixture } from '../../forms/testing/runtime-fixtures';
import {
  editFormSample,
  editFormSampleCollection,
} from './form-preview-sample';

function sample(): Parameters<typeof editFormSample>[0] {
  const schema: JsonObject = {
    type: 'array',
    items: {
      type: 'object',
      properties: { title: { type: 'string' } },
    },
  };
  const fixture = runtimeFixture();
  fixture['data'] = { rows: [{ title: 'B' }, { title: 'A' }], notes: 'Keep' };
  fixture['item_identity'] = {
    '/rows': [
      '01900000-0000-7000-8000-000000000002',
      '01900000-0000-7000-8000-000000000001',
    ],
  };
  fixture['render_schema'] = {
    dialect: 'bpms.render/1',
    root: {
      component: 'table',
      scope: '/properties/rows',
      children: [
        {
          component: 'text',
          scope: '/properties/rows/items/properties/title',
        },
      ],
    },
  };
  fixture['readable_scopes'] = ['/properties/rows'];
  fixture['writable_scopes'] = ['/properties/rows'];
  fixture['required_scopes'] = [];
  fixture['field_metadata'] = [
    {
      scope: '/properties/rows',
      validation_schema: schema,
      writable: true,
      required: false,
    },
  ];
  fixture['actions'] = [];
  const result = readRuntimeDocument(fixture);
  if (result.status !== 'ready') {
    throw Error('Invalid test document');
  }
  const preview = signal<RuntimeCompatibility | null>(result);
  return {
    runtime: computed(() => {
      const value = preview();
      return value?.status === 'ready' ? value.document : null;
    }),
    preview,
    documents: signal<JsonObject>({
      data_schema: { type: 'object', properties: { rows: schema } },
    }),
    data: signal(result.document.canonical),
    sampleJson: '{}',
    previewContextJson: JSON.stringify({
      before_data: { notes: 'Prior' },
      before_item_identity: {},
      policy: null,
    }),
    queuePreview: vi.fn(),
    error: signal(''),
    pending: signal<readonly string[]>([]),
    previewBusy: signal(false),
  };
}

describe('Synthetic sample row integration', () => {
  it('routes delayed edits by current identity and ignores edits to a removed row', async () => {
    const editor = sample();
    const key = '01900000-0000-7000-8000-000000000001';
    const change = {
      scope: '/properties/rows/items/properties/title',
      rowKeys: [key],
      indices: [0],
      value: 'A updated',
    };
    editFormSample(editor, change);
    expect(editor.data()['rows']).toEqual([
      { title: 'B' },
      { title: 'A updated' },
    ]);
    await editFormSampleCollection(
      editor,
      '/properties/rows',
      '/rows',
      'remove',
      key,
    );
    expect(editor.error()).toBe('');
    expect(editor.data()).toEqual({ rows: [{ title: 'B' }], notes: 'Keep' });
    const before = editor.data();
    const calls = vi.mocked(editor.queuePreview).mock.calls.length;
    editFormSample(editor, change);
    expect(editor.data()).toBe(before);
    expect(editor.queuePreview).toHaveBeenCalledTimes(calls);
    expect(JSON.parse(editor.previewContextJson)).toMatchObject({
      before_data: { notes: 'Prior' },
      before_item_identity: {},
      policy: null,
      item_identity: { '/rows': ['01900000-0000-7000-8000-000000000002'] },
    });
    expect(JSON.parse(editor.sampleJson)).toEqual(editor.data());
  });
  it('fences structure while inspector edits are pending', async () => {
    const editor = sample();
    editor.pending.set(['label']);
    const before = editor.data();
    await editFormSampleCollection(editor, '/properties/rows', '/rows', 'add');
    expect(editor.data()).toBe(before);
    expect(editor.queuePreview).not.toHaveBeenCalled();
  });
});
