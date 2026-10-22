import { MultiSelectEscape } from '../multiselect-escape';
import { SelectEscape } from '../select-escape';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SelectControl } from './select-control';
@Component({
  imports: [SelectControl, FormsModule],
  template: `<app-select-control
    ariaLabel="Members"
    inputId="members"
    multiple
    [(ngModel)]="members"
    (selectionChanged)="changes.push($event.target.value)"
  >
    <option value="a">Ada</option>
    <option value="b">Bela</option>
  </app-select-control>`,
})
class MultipleHarness {
  readonly members = signal(['b']);
  changes: unknown[] = [];
}
describe('Multiple choice control', () => {
  it('does not carry a closing fence into a replacement selection mode', async () => {
    const fixture = TestBed.createComponent(SelectControl);
    fixture.componentRef.setInput('multiple', true);
    await fixture.whenStable();
    fixture.debugElement
      .query(By.directive(MultiSelectEscape))
      .injector.get(MultiSelectEscape)
      .closing.set(true);
    fixture.componentRef.setInput('multiple', false);
    await fixture.whenStable();
    expect(
      fixture.debugElement
        .query(By.directive(SelectEscape))
        .injector.get(SelectEscape)
        .closing(),
    ).toBe(false);
    expect(
      fixture.nativeElement
        .querySelector('[role=combobox]')
        .getAttribute('aria-disabled'),
    ).toBe('false');
  });

  it('retains native focus while fencing multiple-choice closing commands', async () => {
    const fixture = TestBed.createComponent(MultipleHarness);
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    const control = fixture.debugElement
      .query(By.directive(MultiSelectEscape))
      .injector.get(MultiSelectEscape);
    const input = root.querySelector<HTMLInputElement>('[role=combobox]')!;
    input.focus();
    expect(document.activeElement).toBe(input);
    control.closing.set(true);
    await fixture.whenStable();
    expect(input.disabled).toBe(false);
    expect(document.activeElement).toBe(input);
    root.querySelector<HTMLElement>('.p-multiselect-label')!.click();
    await fixture.whenStable();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.componentInstance.members()).toEqual(['b']);
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('preserves selected values and CVA updates without synthetic selections', async () => {
    const fixture = TestBed.createComponent(MultipleHarness);
    await fixture.whenStable();
    await vi.waitFor(() =>
      expect(fixture.nativeElement.querySelector('p-multiselect')).toBeTruthy(),
    );
    const root: HTMLElement = fixture.nativeElement;
    expect(
      root.querySelector('[role=combobox]')?.getAttribute('aria-label'),
    ).toBe('Members');
    expect(
      root.querySelector('.p-multiselect-label')?.textContent?.trim(),
    ).toBe('Bela');
    expect(fixture.componentInstance.changes).toEqual([]);
    fixture.componentInstance.members.set(['a']);
    await fixture.whenStable();
    expect(
      root.querySelector('.p-multiselect-label')?.textContent?.trim(),
    ).toBe('Ada');
    expect(fixture.componentInstance.changes).toEqual([]);
  });
});
