import { Locale } from '../../../../core/localization/locale';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TaskControls } from './task-controls';
it('explains competing ownership without exposing claimant identity or granting decisions', async () => {
  const fixture = TestBed.createComponent(TaskControls);
  const ownTask = signal(false);
  const lifecycle = vi.fn();
  fixture.componentRef.setInput('editor', {
    item: () => ({
      status: 'CLAIMED',
      kind: 'HUMAN_TASK',
      claimant: 'private-actor-reference',
    }),
    ownTask,
    canEdit: () => false,
    busy: () => false,
    blocked: () => false,
    lifecycle,
  });
  await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('another reviewer');
  expect(fixture.nativeElement.textContent).not.toContain(
    'private-actor-reference',
  );
  expect(fixture.nativeElement.querySelector('button')).toBeNull();
  expect(lifecycle).not.toHaveBeenCalled();
  ownTask.set(true);
  await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain('You own this task.');
  await TestBed.inject(Locale).set('fa');
  await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain(
    'این کار در اختیار شماست.',
  );
});
