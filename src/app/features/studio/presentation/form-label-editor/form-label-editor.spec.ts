import { TestBed } from '@angular/core/testing';
import { FormLabelEditor } from './form-label-editor';

describe('Visible form label editing', () => {
  it('edits the effective accessibility caption while retaining all other metadata', async () => {
    const fixture = TestBed.createComponent(FormLabelEditor);
    fixture.componentRef.setInput('node', {
      label: 'Fallback',
      accessibility: { label: 'Shown', description: 'Help', role: 'textbox' },
    });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('input').value).toBe('Shown');
    const patched = vi.fn();
    fixture.componentInstance.patched.subscribe(patched);
    fixture.componentInstance.change('Updated');
    expect(patched).toHaveBeenCalledWith({
      key: 'accessibility',
      value: { label: 'Updated', description: 'Help', role: 'textbox' },
    });
  });
  it('opens the effective translation rather than modifying an unused fallback', async () => {
    const fixture = TestBed.createComponent(FormLabelEditor);
    fixture.componentRef.setInput('node', {
      label: 'Fallback',
      accessibility: { label: 'Authored accessibility' },
      messages: {
        label: { key: 'caption' },
        accessibility_label: { key: 'accessible_caption' },
      },
    });
    fixture.componentRef.setInput('resolvedLabel', 'عنوان');
    await fixture.whenStable();
    const patched = vi.fn();
    const requested = vi.fn();
    fixture.componentInstance.patched.subscribe(patched);
    fixture.componentInstance.translationRequested.subscribe(requested);
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('عنوان');
    expect(input.readOnly).toBe(true);
    fixture.componentInstance.change('Wrong fallback edit');
    fixture.nativeElement.querySelector('button').click();
    expect(patched).not.toHaveBeenCalled();
    expect(requested).toHaveBeenCalledWith('accessible_caption');
    fixture.componentRef.setInput('translationDisabled', true);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
  });
  it('preserves legacy translation ownership and canonical binding fallback', async () => {
    const fixture = TestBed.createComponent(FormLabelEditor);
    fixture.componentRef.setInput('node', {
      scope: '/properties/purchase_reason',
      localization_key: 'reason',
    });
    await fixture.whenStable();
    expect(fixture.componentInstance.message()).toBe('reason');
    fixture.componentRef.setInput('node', {
      scope: '/properties/purchase_reason',
    });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('input').placeholder).toBe(
      'Purchase Reason',
    );
    const patched = vi.fn();
    fixture.componentInstance.patched.subscribe(patched);
    fixture.componentRef.setInput('disabled', true);
    fixture.componentInstance.change('Forbidden');
    expect(patched).not.toHaveBeenCalled();
  });
});
