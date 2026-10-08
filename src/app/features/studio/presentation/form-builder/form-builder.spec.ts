import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { RUNTIME_OPTIONS } from '../../../forms/bindings';
import { STUDIO_API } from '../../bindings';
import { FormBuilder } from './form-builder';
const docs = {
  data_schema: { type: 'object', properties: {} },
  render_schema: { root: { component: 'vertical', children: [] } },
};
describe('Form authoring session and edits', () => {
  const get = vi.fn();
  const write = vi.fn();
  const options = vi.fn();
  beforeEach(() => {
    get.mockResolvedValue({ ...docs, ref_id: 'current', status: 'DRAFT' });
    write.mockReset();
    options.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (): string => 'current' } },
          },
        },
        { provide: STUDIO_API, useValue: { get, write, options } },
      ],
    });
  });
  it('blocks saving unapplied invalid JSON and retains visible work', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const editor = fixture.componentInstance;
    editor.schemaJson = '{invalid';
    editor.markPending('schema');
    editor.applySchema();
    await editor.save();
    expect(editor.pending()).toEqual(['schema']);
    expect(editor.schemaJson).toBe('{invalid');
    expect(write).not.toHaveBeenCalled();
  });
  it('ignores a late save response after actor reset', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const editor = fixture.componentInstance;
    let finish: (value: unknown) => void = (): void => undefined;
    write.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const saving = editor.save();
    TestBed.inject(ActorState).reset();
    finish({ ...docs, ref_id: 'leaked-old-actor', status: 'DRAFT' });
    await saving;
    expect(editor.preview()).toBeNull();
    expect(editor.reference()).not.toBe('leaked-old-actor');
    expect(editor.status()).toBe('');
    fixture.detectChanges();
    expect(editor.outline().length).toBe(1);
  });
  it('routes preview choices through author options with current documents', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const port = fixture.debugElement.injector.get(RUNTIME_OPTIONS);
    const input = { data: {}, locale: 'en', page: 1, search: '', selected: [] };
    await port.query(
      {} as Parameters<typeof port.query>[0],
      '/root',
      input,
      1,
      new AbortController().signal,
    );
    expect(options).toHaveBeenCalledWith(
      fixture.componentInstance.documents(),
      '/root',
      input,
      1,
      expect.any(AbortSignal),
    );
  });
});
