import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { STUDIO_API } from '../../bindings';
import { CandidateTargets } from './candidate-targets';
it('restores authorized candidate labels and removes exactly one target', async () => {
  const auxiliary = vi
    .fn()
    .mockResolvedValue([
      { kind: 'users', ref_id: 'user', available: true, label: 'Reviewer' },
    ]);
  TestBed.configureTestingModule({
    providers: [{ provide: STUDIO_API, useValue: { auxiliary } }],
  });
  const fixture = TestBed.createComponent(CandidateTargets);
  fixture.componentRef.setInput('graph', {
    targets: [
      {
        step: 'review',
        user_ref: 'user',
        priority: 3,
        condition: 'request.flag',
      },
      { step: 'other', user_ref: 'user' },
    ],
  });
  fixture.componentRef.setInput('selected', 'review');
  await fixture.whenStable();
  const vm = fixture.componentInstance;
  const applied = vi.fn();
  vm.applied.subscribe(applied);
  expect(fixture.nativeElement.textContent).toContain('Reviewer');
  vm.remove(vm.rows()[0].id);
  expect(applied.mock.calls[0][0].targets).toEqual([
    { step: 'other', user_ref: 'user' },
  ]);
  fixture.componentRef.setInput('disabled', true);
  await fixture.whenStable();
  vm.remove(vm.rows()[0].id);
  expect(applied).toHaveBeenCalledOnce();
});
it('does not display labels returned after actor cleanup', async () => {
  let resolve!: (rows: unknown) => void;
  const promise = new Promise((done) => {
    resolve = done;
  });
  TestBed.configureTestingModule({
    providers: [
      {
        provide: STUDIO_API,
        useValue: { auxiliary: (): Promise<unknown> => promise },
      },
    ],
  });
  const fixture = TestBed.createComponent(CandidateTargets);
  fixture.componentRef.setInput('graph', {
    targets: [{ step: 'review', user_ref: 'user' }],
  });
  fixture.componentRef.setInput('selected', 'review');
  await fixture.whenStable();
  TestBed.inject(ActorState).reset();
  resolve([
    {
      kind: 'users',
      ref_id: 'user',
      available: true,
      label: 'Old private label',
    },
  ]);
  await fixture.whenStable();
  expect(fixture.componentInstance.labels()).toEqual({});
});

it('reconciles candidate summaries in the actual fifty-resource contract batches', async () => {
  const auxiliary = vi.fn().mockResolvedValue([]);
  TestBed.configureTestingModule({
    providers: [{ provide: STUDIO_API, useValue: { auxiliary } }],
  });
  const fixture = TestBed.createComponent(CandidateTargets);
  fixture.componentRef.setInput('selected', 'review');
  fixture.componentRef.setInput('graph', {
    targets: Array.from({ length: 51 }, (_, index) => ({
      step: 'review',
      user_ref: 'user-' + index,
    })),
  });
  await fixture.whenStable();
  expect(auxiliary.mock.calls.map((call) => call[1].resources.length)).toEqual([
    50, 1,
  ]);
});
