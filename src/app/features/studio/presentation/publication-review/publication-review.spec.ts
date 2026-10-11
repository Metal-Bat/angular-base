import { Locale } from '../../../../core/localization/locale';
import { TestBed } from '@angular/core/testing';
import { PublicationReview } from './publication-review';
it('distinguishes pending work, unsaved workspace and immutable publication', async () => {
  const fixture = TestBed.createComponent(PublicationReview);
  fixture.componentRef.setInput('status', 'DRAFT');
  fixture.componentRef.setInput('dirty', true);
  fixture.componentRef.setInput('pending', 1);
  await fixture.whenStable();
  expect(
    fixture.nativeElement.querySelector('[role=status]').textContent,
  ).toContain('Apply or discard');
  fixture.componentRef.setInput('pending', 0);
  await fixture.whenStable();
  expect(
    fixture.nativeElement.querySelector('[role=status]').textContent,
  ).toContain('Save workspace');
  fixture.componentRef.setInput('status', 'PUBLISHED');
  await fixture.whenStable();
  expect(
    fixture.nativeElement.querySelector('[role=status]').textContent,
  ).toContain('immutable');
  expect(fixture.nativeElement.querySelector('button')).toBeNull();
  await TestBed.inject(Locale).set('fa');
  await fixture.whenStable();
  expect(
    fixture.nativeElement.querySelector('[role=status]').textContent,
  ).toContain('تغییرناپذیرند');
});
