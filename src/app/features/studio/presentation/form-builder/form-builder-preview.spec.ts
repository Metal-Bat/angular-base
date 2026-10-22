import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { MISSING } from '../../../forms/domain/canonical-values';
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
  it('retains the confirmed preview on refresh failure and aborts superseded reads', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const view = fixture.componentInstance;
    await view.renderPreview();
    const confirmed = view.runtime();
    expect(confirmed).not.toBeNull();
    let resolve!: (value: RuntimeCompatibility) => void;
    let abort: AbortSignal | undefined;
    preview.mockImplementationOnce(
      (_documents, _data, _purpose, _locale, _context, signal: AbortSignal) => {
        abort = signal;
        return new Promise((done) => {
          resolve = done;
        });
      },
    );
    const obsolete = view.renderPreview();
    expect(view.runtime()).toBe(confirmed);
    view.quickAdd('text');
    view.queuePreview();
    expect(abort?.aborted).toBe(true);
    preview.mockRejectedValueOnce(Error('offline'));
    await view.renderPreview();
    expect(view.previewFreshness()).toBe('failed');
    expect(view.runtime()).toBe(confirmed);
    resolve(ready());
    await obsolete;
    expect(view.previewFreshness()).toBe('failed');
    expect(view.runtime()).toBe(confirmed);
    TestBed.inject(ActorState).reset();
    expect(view.runtime()).toBeNull();
    expect(view.data()).toEqual({});
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
  it('automatically refreshes changed answers and rejects an older in-flight sample preview', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const view = fixture.componentInstance;
    view.quickAdd('text');
    await vi.waitFor(() => expect(preview).toHaveBeenCalledTimes(1));
    let resolve!: (value: RuntimeCompatibility) => void;
    let abort!: AbortSignal;
    preview.mockImplementationOnce(
      (_documents, _data, _purpose, _locale, _context, signal: AbortSignal) => {
        abort = signal;
        return new Promise((done) => {
          resolve = done;
        });
      },
    );
    const old = view.renderPreview();
    const documents = view.documents();
    const answers = view.data();
    view.editSample({ scope: '/properties/field_1', value: 'Latest answer' });
    await fixture.whenStable();
    expect(abort.aborted).toBe(true);
    await vi.waitFor(() => expect(preview).toHaveBeenCalledTimes(3));
    expect(preview.mock.lastCall?.[1]).toEqual({
      ...answers,
      field_1: 'Latest answer',
    });
    const current = view.runtime();
    resolve(ready());
    await old;
    expect(view.runtime()).toBe(current);
    expect(view.previewFreshness()).toBe('ready');
    expect(view.documents()).toBe(documents);
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
  it('retains the focused editable field while automatic sample refresh is pending', async () => {
    TestBed.overrideComponent(FormBuilder, {
      set: { template: '<app-form-live-preview [view]="this" />' },
    });
    const raw = runtimeFixture();
    const render = raw['render_schema'] as {
      root: { children: { component: string }[] };
    };
    render.root.children = render.root.children.filter(
      (node) => node.component !== 'choice',
    );
    preview.mockResolvedValue(readRuntimeDocument(raw));
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    await fixture.componentInstance.renderPreview();
    await fixture.whenStable();
    const field = fixture.nativeElement.querySelector(
      'app-runtime-field input.p-inputtext',
    ) as HTMLInputElement;
    expect(field).not.toBeNull();
    field.focus();
    field.value = '0';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.previewFreshness()).toBe('loading');
    expect(field.isConnected).toBe(true);
    expect(document.activeElement).toBe(field);
    expect(field.value).toBe('0');
    expect(fixture.componentInstance.data()['amount']).toBe(0);
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
    expect(view.previewFreshness()).toBe('loading');
    await vi.waitFor(() => expect(view.previewFreshness()).toBe('ready'));
  });
  it('keeps field-local sample errors from replacing unresolved definition-operation status', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const view = fixture.componentInstance;
    await view.renderPreview();
    view.error.set('Definition save needs review');
    const data = view.data();
    const requests = preview.mock.calls.length;
    view.editSample({
      scope: '/properties/amount',
      value: MISSING,
      error: 'Invalid number',
    });
    expect(view.error()).toBe('Definition save needs review');
    expect(view.data()).toBe(data);
    expect(preview.mock.calls).toHaveLength(requests);
  });
  it('adds a palette field at the drop position as one reversible edit', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.quickAdd('text');
    const before = vm.documents();
    const event = { preventDefault: vi.fn() } as unknown as DragEvent;
    vm.dragPalette(event, 'integer');
    vm.drop(event, [0], 'before');
    expect(vm.outline().map((field) => field.label)).toEqual([
      'vertical',
      'Whole number',
      'Text',
    ]);
    expect(vm.dragging()).toBe(false);
    vm.undo();
    expect(vm.documents()).toEqual(before);
    vm.undo(true);
    expect(vm.selected()).toEqual([0]);
    vm.dragPalette(event, 'date');
    vm.drag(event, [0]);
    vm.drop(event, [], 'inside');
    expect(vm.outline()).toHaveLength(3);
    vm.dragPalette(event, 'text');
    vm.quickAdd('date');
    const changed = vm.documents();
    vm.drop(event, [], 'inside');
    expect(vm.documents()).toBe(changed);
  });
});
