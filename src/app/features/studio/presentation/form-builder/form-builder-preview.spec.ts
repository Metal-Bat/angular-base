import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ActorState } from '../../../../core/auth/actor-state';
import { STUDIO_API } from '../../bindings';
import { RuntimeCompatibility } from '../../../forms/domain/runtime-document';
import { readRuntimeDocument } from '../../../forms/infrastructure/runtime-document-adapter';
import { runtimeFixture } from '../../../forms/testing/runtime-fixtures';
import { FormBuilder } from './form-builder';

function ready(): RuntimeCompatibility {
  return readRuntimeDocument(runtimeFixture());
}

describe('Live unsaved form preview', () => {
  const preview = vi.fn();
  beforeEach(() => {
    preview.mockReset().mockResolvedValue(ready());
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ ref: 'draft' }) },
            paramMap: new BehaviorSubject(convertToParamMap({ ref: 'draft' })),
          },
        },
        {
          provide: STUDIO_API,
          useValue: {
            get: async (): Promise<unknown> => ({
              ref_id: 'draft',
              status: 'DRAFT',
              data_schema: { type: 'object', properties: {} },
              render_schema: { root: { component: 'vertical', children: [] } },
            }),
            preview,
          },
        },
      ],
    });
    TestBed.overrideComponent(FormBuilder, { set: { template: '' } });
  });
  it('debounces automatic unsaved-design refresh without locking the editor', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const view = fixture.componentInstance;
    view.quickAdd('text');
    view.quickAdd('boolean');
    const documents = view.documents();
    await vi.waitFor(() => expect(preview).toHaveBeenCalledTimes(1));
    expect(preview.mock.calls[0][0]).toEqual(documents);
    expect(view.previewFreshness()).toBe('ready');
    expect(view.readonly()).toBe(false);
    expect(view.dirty()).toBe(true);
  });
  it('rejects old design/locale/purpose responses and preserves exact synthetic values', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const view = fixture.componentInstance;
    let resolve!: (result: RuntimeCompatibility) => void;
    preview.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    view.sampleJson =
      '{"amount":"12345678901234567890.125","approved":false,"count":0}';
    const pending = view.renderPreview();
    expect(view.previewBusy()).toBe(true);
    expect(view.busy()).toBe(false);
    view.quickAdd('text');
    view.locale = 'fa';
    view.purpose = 'summary';
    view.queuePreview();
    resolve(ready());
    await pending;
    expect(view.runtime()).toBeNull();
    await view.renderPreview();
    expect(preview.mock.calls.at(-1)?.slice(1, 4)).toEqual([
      { amount: '12345678901234567890.125', approved: false, count: 0 },
      'summary',
      'fa',
    ]);
    expect(view.previewFreshness()).toBe('ready');
  });
  it('keeps invalid buffers out of preview and clears failed or actor-stale results', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const view = fixture.componentInstance;
    view.markPending('inspector');
    await view.renderPreview();
    expect(preview).not.toHaveBeenCalled();
    expect(view.previewFreshness()).toBe('pending');
    view.pending.set([]);
    await fixture.whenStable();
    preview.mockRejectedValueOnce(Error('offline'));
    await view.renderPreview();
    expect(view.runtime()).toBeNull();
    expect(view.previewFreshness()).toBe('failed');
    expect(view.previewBusy()).toBe(false);
    let resolve!: (result: RuntimeCompatibility) => void;
    preview.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const pending = view.renderPreview();
    TestBed.inject(ActorState).reset();
    resolve(ready());
    await pending;
    expect(view.runtime()).toBeNull();
    expect(view.data()).toEqual({});
    expect(view.previewFreshness()).toBe('idle');
    expect(view.reference()).toBe('');
  });
  it('keeps the runtime mounted while typing synthetic answers', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const view = fixture.componentInstance;
    await view.renderPreview();
    const runtime = view.runtime();
    view.editSample({ scope: '/properties/amount', value: '0' });
    expect(view.runtime()).toBe(runtime);
    expect(view.data()['amount']).toBe('0');
    expect(JSON.parse(view.sampleJson)['amount']).toBe('0');
    expect(view.previewFreshness()).toBe('ready');
  });
});
