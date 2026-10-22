import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { STUDIO_API } from '../../bindings';
import { SubprocessSources } from './subprocess-sources';
it('rejects late authorized source responses after actor change or destruction', async () => {
  let complete!: (value: unknown) => void;
  const auxiliary = vi.fn(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  TestBed.configureTestingModule({
    providers: [{ provide: STUDIO_API, useValue: { auxiliary } }],
  });
  const f = TestBed.createComponent(SubprocessSources);
  f.componentRef.setInput('version', 'draft');
  f.componentRef.setInput('step', 'call');
  await f.whenStable();
  const loaded = vi.fn();
  f.componentInstance.loaded.subscribe(loaded);
  f.componentInstance.setRequest('type');
  const pending = f.componentInstance.load();
  TestBed.inject(ActorState).reset();
  loaded.mockClear();
  complete({ items: [{ private: 'old actor' }], totalPages: 1 });
  await pending;
  expect(loaded).not.toHaveBeenCalled();
  expect(f.componentInstance.busy()).toBe(false);
  f.componentInstance.setRequest('type');
  const destroyed = f.componentInstance.load();
  f.destroy();
  loaded.mockClear();
  complete({ items: [{ private: 'old view' }], totalPages: 1 });
  await destroyed;
  expect(loaded).not.toHaveBeenCalled();
});
