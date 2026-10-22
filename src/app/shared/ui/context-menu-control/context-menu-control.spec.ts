import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ContextMenu } from 'primeng/contextmenu';
import { ContextMenuControl } from './context-menu-control';

const mediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia');
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});
afterEach(() => {
  if (mediaDescriptor) {
    Object.defineProperty(window, 'matchMedia', mediaDescriptor);
  } else {
    Reflect.deleteProperty(window, 'matchMedia');
  }
});

function prepare(): {
  control: ContextMenuControl;
  show: ReturnType<typeof vi.fn>;
  panel: HTMLElement;
  anchor: HTMLButtonElement;
} {
  const fixture = TestBed.createComponent(ContextMenuControl);
  fixture.componentRef.setInput('items', []);
  fixture.detectChanges();
  const vendor = fixture.debugElement.query(By.directive(ContextMenu))
    .componentInstance as ContextMenu;
  const show = vi.fn();
  vi.spyOn(vendor, 'show').mockImplementation(show);
  const control = fixture.componentInstance;
  const panel = document.createElement('div');
  panel.id = control.menuId;
  const anchor = document.createElement('button');
  document.body.append(panel, anchor);
  return { control, show, panel, anchor };
}
function request(anchor: HTMLElement, x: number): MouseEvent {
  return {
    currentTarget: anchor,
    clientX: x,
    clientY: 40,
    pageX: x,
    pageY: 40,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as MouseEvent;
}
it('queues the latest reopen until the closing overlay is actually removed', async () => {
  const { control, show, panel, anchor } = prepare();
  control.show(request(anchor, 10));
  control.hidden();
  control.show(request(anchor, 20));
  control.show(request(anchor, 30));
  expect(show).toHaveBeenCalledTimes(1);
  panel.remove();
  await Promise.resolve();
  expect(show).toHaveBeenCalledTimes(2);
  expect(show.mock.calls[1][0].pageX).toBe(30);
  anchor.remove();
});
it('cancels a queued reopen when its owning canvas hides the menu', async () => {
  const { control, show, panel, anchor } = prepare();
  control.show(request(anchor, 10));
  control.hidden();
  control.show(request(anchor, 20));
  control.hide();
  panel.remove();
  await Promise.resolve();
  expect(show).toHaveBeenCalledTimes(1);
  anchor.remove();
});
