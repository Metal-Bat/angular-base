import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { runtimeFixture } from '../../../forms/testing/runtime-fixtures';
import { readRuntimeDocument } from '../../../forms/infrastructure/runtime-document-adapter';
import { FormPreviewContext } from './form-preview-context';
import { JsonObject } from '../../../forms/domain/runtime-document';

describe('Field-based synthetic preview context', () => {
  it('uses the actual simulated policy contract and captures prior row identities atomically', () => {
    const fixture = TestBed.createComponent(FormPreviewContext);
    const parsed = readRuntimeDocument(runtimeFixture());
    if (parsed.status !== 'ready') {
      throw Error('Invalid owned test fixture');
    }
    const runtime = {
      ...parsed.document,
      rowIdentity: { '/rows': ['key-a', 'key-b'] },
    };
    const view = {
      previewContextJson: '',
      documents: signal<JsonObject>({
        data_schema: { type: 'object', properties: {} },
      }),
      outline: signal([
        {
          label: 'Amount',
          scope: '/properties/amount',
          identity: 'amount',
          path: [0],
        },
        {
          label: 'Amount repeated',
          scope: '/properties/amount',
          identity: 'second-amount',
          path: [1],
        },
      ]),
      data: signal<JsonObject>({
        rows: [{ name: 'First' }, { name: 'Second' }],
      }),
      runtime: signal(runtime),
      queuePreview: vi.fn(),
      contextEpoch: signal(0),
      previewFreshness: signal<'ready' | 'pending'>('ready'),
    };
    fixture.componentRef.setInput('view', view);
    const vm = fixture.componentInstance;
    expect(vm.context()).toEqual({});
    vm.simulate(true);
    expect(vm.context()['policy']).toEqual({
      read: ['/properties/amount'],
      write: ['/properties/amount'],
      required: [],
      hidden: [],
    });
    vm.permission('write', '/properties/amount', false);
    vm.capture();
    const context = vm.context();
    expect(context['before_data']).toEqual(view.data());
    expect(context['before_item_identity']).toEqual(runtime.rowIdentity);
    expect(context['policy']).toEqual({
      read: ['/properties/amount'],
      write: [],
      required: [],
      hidden: [],
    });
    view.previewFreshness.set('pending');
    view.data.set({ rows: [] });
    vm.capture();
    expect(vm.context()).toEqual(context);
    vm.simulate(false);
    expect(vm.context()['policy']).toBeNull();
    expect(vm.context()['before_item_identity']).toEqual(runtime.rowIdentity);
  });
});
