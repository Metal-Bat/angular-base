import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { STUDIO_API } from '../../bindings';
import { StudioChoice } from './studio-choice';
import { JsonObject } from '../../../forms/domain/runtime-document';
const summary = {
  kind: 'form_versions',
  ref_id: 'current',
  label: 'Form',
  number: 2,
  available: true,
};
const page = {
  items: [{ key: 'current', value: 'Form v2' }],
  page: 1,
  totalPages: 2,
};
async function setup(value = ''): Promise<{
  fixture: ReturnType<typeof TestBed.createComponent<StudioChoice>>;
  api: {
    choices: ReturnType<typeof vi.fn>;
    auxiliary: ReturnType<typeof vi.fn>;
  };
}> {
  const api = {
    choices: vi.fn().mockResolvedValue(page),
    auxiliary: vi.fn().mockResolvedValue([summary]),
  };
  TestBed.configureTestingModule({
    providers: [{ provide: STUDIO_API, useValue: api }],
  });
  const fixture = TestBed.createComponent(StudioChoice);
  fixture.componentRef.setInput('kind', 'form_versions');
  fixture.componentRef.setInput('controlId', 'test-form');
  fixture.componentRef.setInput('value', value);
  await fixture.whenStable();
  return { fixture, api };
}
it('keeps keys authoritative and rejects late account results', async () => {
  const { fixture, api } = await setup();
  const vm = fixture.componentInstance;
  let resolve!: (value: { items: JsonObject[]; totalPages: number }) => void;
  api.choices.mockImplementationOnce(
    () => new Promise((done) => (resolve = done)),
  );
  const picked = vi.fn();
  vm.picked.subscribe(picked);
  const pending = vm.load();
  const abort = api.choices.mock.calls[0][3] as AbortSignal;
  TestBed.inject(ActorState).reset();
  expect(abort.aborted).toBe(true);
  resolve(page);
  await pending;
  expect(vm.rows()).toEqual([]);
  expect(vm.busy()).toBe(false);
  await vm.choose('current');
  expect(picked).not.toHaveBeenCalled();
  await vm.load(2);
  await vm.choose('Form v2');
  expect(picked).not.toHaveBeenCalled();
  await vm.choose('current');
  expect(picked).toHaveBeenCalledExactlyOnceWith('current');
  expect(api.choices).toHaveBeenLastCalledWith(
    'form_versions',
    { page: 2, size: 20, search: null },
    { locale: 'en' },
    expect.any(AbortSignal),
  );
  fixture.componentRef.setInput('disabled', true);
  await fixture.whenStable();
  await vm.choose('current');
  expect(picked).toHaveBeenCalledTimes(1);
});
it('restores an out-of-page version and permits an explicit clear', async () => {
  const { fixture } = await setup('old-ref');
  const vm = fixture.componentInstance;
  expect(vm.selected()).toEqual({ key: 'current', label: 'Form · 2' });
  const picked = vi.fn();
  vm.picked.subscribe(picked);
  await vm.load(2);
  expect(vm.fallback()).toBe(true);
  await vm.choose('');
  expect(picked).toHaveBeenCalledExactlyOnceWith('');
  expect(vm.selected()).toBeNull();
});
it('rechecks applied constraints and does not emit a revoked selection', async () => {
  const { fixture, api } = await setup();
  const vm = fixture.componentInstance;
  const picked = vi.fn();
  vm.picked.subscribe(picked);
  fixture.componentRef.setInput('context', { client_ref_id: 'parent' });
  await fixture.whenStable();
  await vm.load(2);
  api.choices.mockResolvedValueOnce({ ...page, items: [] });
  await vm.choose('current');
  expect(picked).not.toHaveBeenCalled();
  expect(vm.rows()).toEqual([]);
  expect(vm.error()).toContain('unavailable');
  expect(api.auxiliary).not.toHaveBeenCalled();
});
it('cancels old searches and parent context reads', async () => {
  const { fixture, api } = await setup();
  {
    const vm = fixture.componentInstance;
    let resolve!: (value: unknown) => void;
    api.choices.mockImplementationOnce(
      () => new Promise((done) => (resolve = done)),
    );
    const pending = vm.load();
    const abort = api.choices.mock.calls[0][3] as AbortSignal;
    vm.scheduleSearch('new');
    expect(abort.aborted).toBe(true);
    resolve(page);
    await pending;
    expect(vm.rows()).toEqual([]);
    await new Promise((settle) => setTimeout(settle, 300));
    expect(vm.search()).toBe('new');
    expect(api.choices).toHaveBeenLastCalledWith(
      'form_versions',
      { page: 1, size: 20, search: 'new' },
      { locale: 'en' },
      expect.any(AbortSignal),
    );
    fixture.componentRef.setInput('context', { client_ref_id: 'other' });
    await fixture.whenStable();
    expect(vm.rows()).toEqual([]);
    fixture.destroy();
  }
});
