import { TestBed } from '@angular/core/testing';
import { FormActionSettings } from './form-action-settings';

describe('Declared form action outcomes', () => {
  it('retains an unavailable existing value for repair and emits only declared exact keys', async () => {
    const fixture = TestBed.createComponent(FormActionSettings);
    fixture.componentRef.setInput('documents', {
      render_schema: {
        outcomes: ['next', 'return_for_changes'],
        root: { component: 'vertical' },
      },
    });
    fixture.componentRef.setInput('node', {
      component: 'action',
      outcome: 'old_outcome',
    });
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const changed = vi.fn();
    vm.outcomeChanged.subscribe(changed);
    expect(vm.unavailable()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      'Choose a declared outcome',
    );
    vm.choose('approve_everything');
    expect(changed).not.toHaveBeenCalled();
    vm.choose('return_for_changes');
    expect(changed).toHaveBeenCalledWith('return_for_changes');
    fixture.componentRef.setInput('disabled', true);
    vm.choose('next');
    expect(changed).toHaveBeenCalledOnce();
  });
});
