import { EventEmitter } from '@angular/core';
import { bindSelectEscape } from './select-escape';
describe('Select Escape during entry', () => {
  it('replays an early Escape after completed entry, rather than during the before-enter notification', async () => {
    const host = document.createElement('div');
    host.innerHTML = '<span role="combobox" aria-expanded="true"></span>';
    const shown = new EventEmitter<void>();
    const hidden = new EventEmitter<void>();
    const entered = new EventEmitter<void>();
    const close = vi.fn();
    const release = bindSelectEscape(
      host,
      shown,
      hidden,
      close,
      undefined,
      entered,
    );
    host
      .querySelector('span')!
      .dispatchEvent(
        new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }),
      );
    shown.emit();
    await Promise.resolve();
    expect(close).not.toHaveBeenCalled();
    entered.emit();
    expect(close).toHaveBeenCalledExactlyOnceWith(true);
    release();
    entered.emit();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('starts the closing fence synchronously before native Escape, without waiting for the leave callback', () => {
    const host = document.createElement('div');
    host.innerHTML = '<span role="combobox" aria-expanded="true"></span>';
    const shown = new EventEmitter<void>();
    const hidden = new EventEmitter<void>();
    let fenced = false;
    const native = vi.fn(() => expect(fenced).toBe(true));
    const release = bindSelectEscape(host, shown, hidden, vi.fn(), () => {
      fenced = true;
    });
    const control = host.querySelector('span')!;
    control.addEventListener('keydown', native);
    control.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }),
    );
    expect(native).toHaveBeenCalledOnce();
    release();
  });
  it('restores focus for body Escape after an owned option click, and releases ownership on an outside pointer', () => {
    const { host, shown, hidden, close, release } = setup();
    host
      .querySelector('span')!
      .setAttribute('aria-controls', 'owned-select-list');
    const panel = document.createElement('div');
    panel.className = 'p-multiselect-overlay';
    panel.innerHTML = '<ul id="owned-select-list"><li>Option</li></ul>';
    const outside = document.createElement('button');
    document.body.append(panel, outside);
    try {
      shown.emit();
      panel
        .querySelector('li')!
        .dispatchEvent(new Event('pointerdown', { bubbles: true }));
      const owned = new KeyboardEvent('keydown', {
        code: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      document.body.dispatchEvent(owned);
      expect(close).toHaveBeenCalledExactlyOnceWith(true);
      expect(owned.defaultPrevented).toBe(true);
      hidden.emit();
      shown.emit();
      outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      const foreign = new KeyboardEvent('keydown', {
        code: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      document.body.dispatchEvent(foreign);
      expect(close).toHaveBeenCalledTimes(1);
      expect(foreign.defaultPrevented).toBe(false);
    } finally {
      release();
      panel.remove();
      outside.remove();
    }
  });
  it('never looks up an empty controls ID for an expanded selector without a mounted list', () => {
    const { shown, close, release } = setup();
    const lookup = vi.spyOn(document, 'getElementById');
    try {
      shown.emit();
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }),
      );
      expect(lookup).not.toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
    } finally {
      release();
      lookup.mockRestore();
    }
  });

  it('closes only its owned popup and consumes Escape before the parent overlay', () => {
    const { host, shown, close, release } = setup();
    host
      .querySelector('span')!
      .setAttribute('aria-controls', 'owned-select-list');
    const popup = document.createElement('div');
    popup.className = 'p-multiselect-overlay';
    popup.innerHTML =
      '<ul id="owned-select-list"><li><button>Option</button></li></ul>';
    document.body.appendChild(popup);
    shown.emit();
    const parent = vi.fn();
    document.addEventListener('keydown', parent);
    const event = new KeyboardEvent('keydown', {
      code: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    try {
      popup.querySelector('button')!.dispatchEvent(event);
      expect(close).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
      expect(parent).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', parent);
      release();
      popup.remove();
    }
  });
  it('preserves Escape outside the owned popup even while its own control is expanded', () => {
    const { host, shown, close, release } = setup();
    host
      .querySelector('span')!
      .setAttribute('aria-controls', 'owned-select-list');
    const popup = document.createElement('div');
    popup.className = 'p-multiselect-overlay';
    popup.innerHTML = '<ul id="owned-select-list"></ul>';
    const outside = document.createElement('button');
    document.body.append(popup, outside);
    shown.emit();
    const event = new KeyboardEvent('keydown', {
      code: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    try {
      outside.dispatchEvent(event);
      expect(close).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    } finally {
      release();
      popup.remove();
      outside.remove();
    }
  });

  function setup(): {
    host: HTMLElement;
    shown: EventEmitter<void>;
    hidden: EventEmitter<void>;
    close: ReturnType<typeof vi.fn>;
    release: () => void;
  } {
    const host = document.createElement('div');
    host.innerHTML =
      '<span tabindex="0" role="combobox" aria-expanded="true"></span>';
    const shown = new EventEmitter<void>();
    const hidden = new EventEmitter<void>();
    const close = vi.fn();
    const release = bindSelectEscape(host, shown, hidden, close);
    return { host, shown, hidden, close, release };
  }
  it('preserves an early Escape across the opening notification without consuming the key', async () => {
    const { host, shown, close, release } = setup();
    const event = new KeyboardEvent('keydown', {
      code: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    host.querySelector('span')!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    shown.emit();
    expect(close).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(close).toHaveBeenCalledTimes(1);
    release();
  });
  it('clears cancellation after closing and ignores Escape on an already closed control', async () => {
    const { host, shown, hidden, close, release } = setup();
    const trigger = host.querySelector('span')!;
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }),
    );
    hidden.emit();
    shown.emit();
    await Promise.resolve();
    expect(close).not.toHaveBeenCalled();
    trigger.setAttribute('aria-expanded', 'false');
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }),
    );
    shown.emit();
    await Promise.resolve();
    expect(close).not.toHaveBeenCalled();
    release();
  });
  it('cancels queued work and subscriptions when its owning control is destroyed', async () => {
    const { host, shown, close, release } = setup();
    host
      .querySelector('span')!
      .dispatchEvent(
        new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }),
      );
    shown.emit();
    release();
    await Promise.resolve();
    shown.emit();
    expect(close).not.toHaveBeenCalled();
  });
});

it('preserves a single-select Enter dismissal across late overlay entry without swallowing selection', () => {
  const host = document.createElement('div');
  host.innerHTML = '<span role="combobox" aria-expanded="true"></span>';
  const shown = new EventEmitter<void>();
  const hidden = new EventEmitter<void>();
  const entered = new EventEmitter<void>();
  const close = vi.fn();
  const selection = vi.fn();
  const release = bindSelectEscape(
    host,
    shown,
    hidden,
    close,
    undefined,
    entered,
    true,
  );
  const control = host.querySelector('span')!;
  control.addEventListener('keydown', selection);
  control.dispatchEvent(
    new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }),
  );
  shown.emit();
  expect(selection).toHaveBeenCalledOnce();
  expect(close).not.toHaveBeenCalled();
  entered.emit();
  expect(close).toHaveBeenCalledExactlyOnceWith(true);
  release();
});

it('keeps MultiSelect Enter selection open across entry', () => {
  const host = document.createElement('div');
  host.innerHTML = '<span role="combobox" aria-expanded="true"></span>';
  const shown = new EventEmitter<void>();
  const hidden = new EventEmitter<void>();
  const entered = new EventEmitter<void>();
  const close = vi.fn();
  const release = bindSelectEscape(
    host,
    shown,
    hidden,
    close,
    undefined,
    entered,
  );
  host
    .querySelector('span')!
    .dispatchEvent(
      new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }),
    );
  shown.emit();
  entered.emit();
  expect(close).not.toHaveBeenCalled();
  release();
});
