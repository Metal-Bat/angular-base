import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../core/auth/actor-state';
import { FilePicker } from './file-picker';

async function setup(): Promise<{
  fixture: ReturnType<typeof TestBed.createComponent<FilePicker>>;
  picked: ReturnType<typeof vi.fn>;
  element: HTMLElement;
}> {
  const fixture = TestBed.createComponent(FilePicker);
  fixture.componentRef.setInput('controlId', 'private-file');
  fixture.componentRef.setInput('owner', 'case-one');
  const picked = vi.fn();
  fixture.componentInstance.picked.subscribe(picked);
  await fixture.whenStable();
  return { fixture, picked, element: fixture.nativeElement as HTMLElement };
}
function drop(
  element: HTMLElement,
  files: readonly File[],
  types = ['Files'],
): Event {
  const event = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { types, files } });
  element.querySelector('.file-drop')!.dispatchEvent(event);
  return event;
}
describe('Local file selection', () => {
  it('uses the same file output for native selection and a single file drop', async () => {
    const { fixture, picked, element } = await setup();
    const file = new File(['receipt'], 'receipt.txt', { type: 'text/plain' });
    const input = element.querySelector('input')!;
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    expect(picked).toHaveBeenLastCalledWith(file);
    expect(drop(element, [file]).defaultPrevented).toBe(true);
    expect(picked).toHaveBeenCalledTimes(2);
    await fixture.whenStable();
    expect(element.textContent).toContain('receipt.txt');
    expect(element.textContent).toContain('7');
  });
  it('rejects multiple files, ignores URL/text drags, and blocks disabled drops', async () => {
    const { fixture, picked, element } = await setup();
    const file = new File(['private'], 'private.txt');
    drop(element, [file, file]);
    await fixture.whenStable();
    expect(element.querySelector('[role=alert]')?.textContent).toContain(
      'one file',
    );
    expect(picked).not.toHaveBeenCalled();
    expect(drop(element, [file], ['text/uri-list']).defaultPrevented).toBe(
      false,
    );
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(drop(element, [file]).defaultPrevented).toBe(true);
    expect(picked).not.toHaveBeenCalled();
    expect(element.querySelector('input')?.disabled).toBe(true);
  });
  it('clears a private local name on owner changes and actor cleanup', async () => {
    const { fixture, element } = await setup();
    const file = new File(['private'], 'private.txt');
    drop(element, [file]);
    await fixture.whenStable();
    expect(element.textContent).toContain('private.txt');
    fixture.componentRef.setInput('owner', 'case-two');
    await fixture.whenStable();
    expect(element.textContent).not.toContain('private.txt');
    drop(element, [file]);
    TestBed.inject(ActorState).reset();
    await fixture.whenStable();
    expect(element.textContent).not.toContain('private.txt');
  });
});
