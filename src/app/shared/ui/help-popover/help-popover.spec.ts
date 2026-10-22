import { TestBed } from '@angular/core/testing';
import { HelpPopover } from './help-popover';

it('keeps icon-only guidance named and its expanded relationship available', async () => {
  const fixture = TestBed.createComponent(HelpPopover);
  fixture.componentRef.setInput('iconOnly', true);
  fixture.componentRef.setInput('label', 'About preview');
  await fixture.whenStable();
  const trigger = fixture.nativeElement.querySelector(
    'button',
  ) as HTMLButtonElement;
  expect(trigger.textContent?.trim()).toBe('About preview');
  expect(trigger.querySelector('i')?.getAttribute('aria-hidden')).toBe('true');
  trigger.click();
  await fixture.whenStable();
  await vi.waitFor(() =>
    expect(trigger.getAttribute('aria-expanded')).toBe('true'),
  );
  const popup = document.getElementById(
    trigger.getAttribute('aria-controls')!,
  )!;
  expect(popup.getAttribute('aria-labelledby')).toBe(trigger.id);
  fixture.destroy();
});

it('exposes its expanded state and returns keyboard focus after closing guidance', async () => {
  const fixture = TestBed.createComponent(HelpPopover);
  await fixture.whenStable();
  const trigger = fixture.nativeElement.querySelector(
    'button',
  ) as HTMLButtonElement;
  trigger.click();
  await fixture.whenStable();
  await vi.waitFor(() =>
    expect(trigger.getAttribute('aria-expanded')).toBe('true'),
  );
  const popup = document.getElementById(fixture.componentInstance.id)!;
  expect(popup.getAttribute('aria-modal')).toBe('false');
  const close = popup.querySelector('button')!;
  await vi.waitFor(() => expect(document.activeElement).toBe(close));
  close.click();
  await vi.waitFor(() =>
    expect(trigger.getAttribute('aria-expanded')).toBe('false'),
  );
  expect(document.activeElement).toBe(trigger);
  fixture.destroy();
});
