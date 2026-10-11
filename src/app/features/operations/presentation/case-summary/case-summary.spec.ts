import { Locale } from '../../../../core/localization/locale';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { PROCESS_DESTINATION } from '../../bindings';
import { CaseSummary } from './case-summary';
it('cancels task destination lookup and ignores late results after actor cleanup', async () => {
  let finish!: (value: string) => void;
  const resolve = vi.fn().mockImplementation(
    () =>
      new Promise<string>((done) => {
        finish = done;
      }),
  );
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: PROCESS_DESTINATION, useValue: resolve },
    ],
  });
  const navigate = vi
    .spyOn(TestBed.inject(Router), 'navigate')
    .mockResolvedValue(true);
  const fixture = TestBed.createComponent(CaseSummary);
  fixture.componentRef.setInput('kind', 'task');
  fixture.componentRef.setInput('item', {
    ref: 'task',
    request: 'parent',
    status: 'COMPLETED',
    kind: 'HUMAN_TASK',
    claimant: null,
    process: null,
    form: null,
    workflow: null,
    runtime: null,
  });
  await fixture.whenStable();
  const work = fixture.componentInstance.openProcess();
  const abort = resolve.mock.calls[0][1] as AbortSignal;
  TestBed.inject(ActorState).reset();
  finish('old-account-process');
  await work;
  expect(abort.aborted).toBe(true);
  expect(navigate).not.toHaveBeenCalled();
  await fixture.componentInstance.openProcess();
  expect(resolve).toHaveBeenCalledOnce();
});
it('uses the task parent reference and clears omitted destinations', async () => {
  const resolve = vi.fn().mockResolvedValue('current-process');
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: PROCESS_DESTINATION, useValue: resolve },
    ],
  });
  const navigate = vi
    .spyOn(TestBed.inject(Router), 'navigate')
    .mockResolvedValue(true);
  const fixture = TestBed.createComponent(CaseSummary);
  const item = {
    ref: 'task',
    request: 'current-request',
    status: 'COMPLETED',
    kind: 'HUMAN_TASK',
    claimant: null,
    process: null,
    form: null,
    workflow: null,
    runtime: null,
  };
  fixture.componentRef.setInput('kind', 'task');
  fixture.componentRef.setInput('item', item);
  await fixture.whenStable();
  await fixture.componentInstance.openProcess();
  expect(resolve.mock.calls[0][0]).toBe('current-request');
  expect(navigate).toHaveBeenCalledWith([
    '/operations/processes',
    'current-process',
  ]);
  fixture.componentRef.setInput('disabled', true);
  await fixture.whenStable();
  await fixture.componentInstance.openProcess();
  expect(resolve).toHaveBeenCalledOnce();
  fixture.componentRef.setInput('item', { ...item, request: null });
  await fixture.whenStable();
  expect(fixture.nativeElement.querySelector('a')).toBeNull();
  expect(fixture.nativeElement.querySelector('button')).toBeNull();
});
it('presents authorized activity and removes it when the next case omits the projection', async () => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: PROCESS_DESTINATION, useValue: vi.fn() },
    ],
  });
  const fixture = TestBed.createComponent(CaseSummary);
  const item = {
    ref: 'current',
    status: 'DRAFT',
    kind: 'HUMAN_TASK',
    claimant: null,
    process: null,
    form: null,
    workflow: 'pin',
    runtime: null,
  };
  fixture.componentRef.setInput('kind', 'request');
  fixture.componentRef.setInput('item', {
    ...item,
    summary: {
      created_at: '2026-10-10T12:00:00Z',
      priority: 0,
      submitted_at: null,
    },
  });
  await fixture.whenStable();
  expect(
    fixture.nativeElement.querySelector('app-record-summary').textContent,
  ).toContain('Case activity');
  expect(
    fixture.nativeElement.querySelector('app-record-summary').textContent,
  ).toContain('0');
  await TestBed.inject(Locale).set('fa');
  await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('فعالیت پرونده');
  fixture.componentRef.setInput('item', item);
  await fixture.whenStable();
  expect(fixture.nativeElement.querySelector('app-record-summary')).toBeNull();
});
