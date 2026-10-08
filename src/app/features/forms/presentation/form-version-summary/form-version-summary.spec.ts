import { TestBed } from '@angular/core/testing';

import { FormVersionSummary } from './form-version-summary';

describe('Shared form version identity presentation', () => {
  it('renders opaque pins as text and updates when the authorized version changes', async () => {
    const fixture = TestBed.createComponent(FormVersionSummary);
    fixture.componentRef.setInput('version', {
      definitionReference: '<script>form</script>',
      versionReference: 'pinned/v1?rev=1',
      number: 1,
    });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('dl')?.getAttribute('aria-label')).toBe(
      'Pinned form version',
    );
    expect(element.querySelectorAll('dd')[0].textContent).toBe(
      '<script>form</script>',
    );
    expect(element.querySelector('script')).toBeNull();
    expect(element.textContent).toContain('pinned/v1?rev=1');
    fixture.componentRef.setInput('version', {
      definitionReference: 'other-form',
      versionReference: 'pinned/v2',
      number: 2,
    });
    await fixture.whenStable();
    expect(element.textContent).toContain('pinned/v2');
    expect(element.textContent).not.toContain('pinned/v1?rev=1');
  });
});
