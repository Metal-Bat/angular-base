import { TestBed } from '@angular/core/testing';
import { QueryChoice } from './query-choice';

it('retains selected canonical options while exposing a multiple-choice control', async () => {
  const fixture = TestBed.createComponent(QueryChoice);
  fixture.componentRef.setInput('controlId', 'typed-choice');
  fixture.componentRef.setInput('options', ['WEB', 'SDK']);
  fixture.componentRef.setInput('multiple', true);
  fixture.componentRef.setInput('value', 'WEB\nSDK');
  await fixture.whenStable();
  expect(fixture.nativeElement.querySelector('p-multiselect')).toBeTruthy();
  expect(fixture.componentInstance.selection()).toEqual(['WEB', 'SDK']);
  fixture.componentRef.setInput('disabled', true);
  await fixture.whenStable();
  fixture.componentInstance.choose(['WEB']);
  expect(fixture.componentInstance.value()).toBe('WEB\nSDK');
  fixture.destroy();
});
