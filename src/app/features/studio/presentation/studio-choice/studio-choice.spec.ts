import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { STUDIO_API } from '../../bindings';
import { StudioChoice } from './studio-choice';
import { JsonObject } from '../../../forms/domain/runtime-document';
it('keeps selector keys authoritative and ignores late actor-owned results', async () => {
  let resolve!: (value: { items: JsonObject[]; totalPages: number }) => void;
  const api = {
    auxiliary: vi.fn(
      () =>
        new Promise<{ items: JsonObject[]; totalPages: number }>(
          (done) => (resolve = done),
        ),
    ),
  };
  TestBed.configureTestingModule({
    providers: [{ provide: STUDIO_API, useValue: api }],
  });
  const fixture = TestBed.createComponent(StudioChoice);
  fixture.componentRef.setInput('kind', 'form_versions');
  fixture.componentRef.setInput('controlId', 'test-form');
  await fixture.whenStable();
  const vm = fixture.componentInstance;
  const picked = vi.fn();
  vm.picked.subscribe(picked);
  const pending = vm.load();
  TestBed.inject(ActorState).reset();
  resolve({
    items: [{ key: 'private-current', value: 'Private form' }],
    totalPages: 1,
  });
  await pending;
  expect(vm.rows()).toEqual([]);
  expect(vm.busy()).toBe(false);
  vm.choose('private-current');
  expect(picked).not.toHaveBeenCalled();
  const next = vm.load();
  resolve({
    items: [{ key: 'current', value: 'Form version 1' }],
    totalPages: 1,
  });
  await next;
  vm.choose('Form version 1');
  expect(picked).not.toHaveBeenCalled();
  vm.choose('current');
  expect(picked).toHaveBeenCalledWith('current');
  expect(api.auxiliary).toHaveBeenLastCalledWith(
    'selectors',
    { page: 1, size: 20 },
    { kind: 'form_versions' },
  );
  fixture.componentRef.setInput('disabled', true);
  await fixture.whenStable();
  expect(vm.rows()).toEqual([]);
  vm.choose('current');
  expect(picked).toHaveBeenCalledTimes(1);
});
