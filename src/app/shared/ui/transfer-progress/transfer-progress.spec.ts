import { TestBed } from '@angular/core/testing';
import { TransferProgress } from './transfer-progress';

describe('Transfer progress accessibility', () => {
  it('keeps an unknown total indeterminate and exposes a measured zero without unsupported ARIA', async () => {
    const fixture = TestBed.createComponent(TransferProgress);
    await fixture.whenStable();
    let progress = fixture.nativeElement.querySelector(
      'progress',
    ) as HTMLElement;
    expect(progress.getAttribute('aria-label')).toBe('Transfer in progress');
    expect(progress.hasAttribute('value')).toBe(false);
    expect(progress.hasAttribute('aria-level')).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('%');
    fixture.componentRef.setInput('value', 0);
    await fixture.whenStable();
    progress = fixture.nativeElement.querySelector('progress');
    expect(progress.getAttribute('value')).toBe('0');
    expect(progress.hasAttribute('aria-level')).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('0%');
  });
});
