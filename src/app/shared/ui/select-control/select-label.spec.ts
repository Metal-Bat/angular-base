import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SelectControl } from './select-control';
import { Locale } from '../../../core/localization/locale';
import { ControlField } from '../control-field/control-field';
@Component({
  imports: [ControlField, SelectControl],
  template: `<app-control-field
    controlId="policy"
    label="Policy"
    [required]="true"
  >
    <app-select-control inputId="policy" value="a"
      ><option value="a">Public</option></app-select-control
    >
  </app-control-field>`,
})
class RequiredHarness {}
describe('Required select label', () => {
  it('updates the accessible label after a locale change without rebuilding literal options', async () => {
    const fixture = TestBed.createComponent(RequiredHarness);
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    const locale = TestBed.inject(Locale);
    const options = root.querySelector('select option');
    await locale.set('fa');
    await fixture.whenStable();
    await vi.waitFor(() =>
      expect(
        root.querySelector('[role=combobox]')?.getAttribute('aria-label'),
      ).toBe(locale.text('Policy') + ' ' + locale.text('Required')),
    );
    expect(root.querySelector('select option')).toBe(options);
    expect(options?.textContent).toBe('Public');
  });

  it('excludes the decorative star and retains the separated screen-reader required text', async () => {
    const fixture = TestBed.createComponent(RequiredHarness);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('label [aria-hidden="true"]')
        .textContent,
    ).toBe('*');
    expect(
      fixture.nativeElement
        .querySelector('[role=combobox]')
        .getAttribute('aria-label'),
    ).toBe('Policy Required');
  });
});
