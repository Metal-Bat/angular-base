import { Locale } from '../../../../core/localization/locale';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ExecutionPath } from './execution-path';
import { ProcessSnapshot } from '../../domain/process-tracking';
it('filters recorded steps without changing active branches and fences selection by process pin', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(ExecutionPath);
  const process: ProcessSnapshot = {
    reference: 'process',
    request: 'request',
    workflow: 'pinned',
    status: 'WAITING',
    positions: [
      { step: 'review-a', status: 'WAITING', wait: 'HUMAN_TASK' },
      { step: 'review-b', status: 'RUNNING', wait: null },
    ],
    steps: [
      { key: 'review-a', status: 'WAITING', executions: [] },
      { key: 'review-b', status: 'RUNNING', executions: [] },
    ],
    children: [{ reference: 'child', status: 'RUNNING' }],
    events: [],
    page: 1,
    totalPages: 1,
    coverage: null,
  };
  fixture.componentRef.setInput('process', process);
  await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('review-a');
  expect(fixture.nativeElement.textContent).toContain('review-b');
  fixture.componentInstance.selectStep('review-a');
  await fixture.whenStable();
  expect(fixture.componentInstance.steps().map((step) => step.key)).toEqual([
    'review-a',
  ]);
  expect(fixture.componentInstance.process().positions).toHaveLength(2);
  fixture.componentInstance.selectStep('invented');
  expect(fixture.componentInstance.selectedStep()).toBe('review-a');
  fixture.componentRef.setInput('process', {
    ...process,
    reference: 'next-process',
  });
  await fixture.whenStable();
  expect(fixture.componentInstance.selectedStep()).toBe('');
  expect(fixture.componentInstance.steps()).toHaveLength(2);
  await TestBed.inject(Locale).set('fa');
  await fixture.whenStable();
  expect(
    fixture.nativeElement
      .querySelector('app-select-control [role=combobox]')
      .getAttribute('aria-label'),
  ).toBe('مرحله اجرا');
});
