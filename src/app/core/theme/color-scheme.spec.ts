import { TestBed } from '@angular/core/testing';
import { ColorScheme, themePalettes } from './color-scheme';
import { ActorState } from '../auth/actor-state';
describe('Named workspace themes', () => {
  it('restores the application default on actor change instead of carrying another user appearance', () => {
    const scheme = TestBed.inject(ColorScheme);
    scheme.select('rose-dark');
    TestBed.inject(ActorState).reset();
    expect(scheme.selected()).toBe('blue-light');
    expect(scheme.mode()).toBe('light');
    expect(document.documentElement.classList.contains('app-dark')).toBe(false);
  });
  it('tracks system changes only in system mode and releases the media listener', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    const media = Object.assign(new EventTarget(), { matches: true });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue(media),
    });
    const remove = vi.spyOn(media, 'removeEventListener');
    Object.defineProperty(media, 'matches', {
      value: true,
      configurable: true,
    });
    const scheme = TestBed.inject(ColorScheme);
    scheme.setMode('system');
    expect(scheme.dark()).toBe(true);
    Object.defineProperty(media, 'matches', {
      value: false,
      configurable: true,
    });
    media.dispatchEvent(new Event('change'));
    expect(scheme.dark()).toBe(false);
    scheme.select('blue-dark');
    media.dispatchEvent(new Event('change'));
    expect(scheme.dark()).toBe(true);
    TestBed.resetTestingModule();
    expect(remove).toHaveBeenCalledWith('change', expect.any(Function));
    if (original) {
      Object.defineProperty(window, 'matchMedia', original);
    } else {
      Reflect.deleteProperty(window, 'matchMedia');
    }
  });
  afterEach(() => {
    document.documentElement.classList.remove('app-dark');
    delete document.documentElement.dataset['palette'];
  });
  it('applies every supported palette in both modes and keeps its selected option in sync', () => {
    const scheme = TestBed.inject(ColorScheme);
    for (const palette of themePalettes) {
      for (const mode of ['light', 'dark']) {
        scheme.select(`${palette.key}-${mode}`);
        expect(scheme.palette()).toBe(palette.key);
        expect(scheme.selected()).toBe(`${palette.key}-${mode}`);
        expect(document.documentElement.dataset['palette']).toBe(palette.key);
        expect(document.documentElement.classList.contains('app-dark')).toBe(
          mode === 'dark',
        );
      }
    }
  });
  it('ignores unknown options and preserves the palette when toggling modes', () => {
    const scheme = TestBed.inject(ColorScheme);
    scheme.select('teal-dark');
    scheme.select('invalid-light');
    expect(scheme.selected()).toBe('teal-dark');
    scheme.toggle();
    expect(scheme.selected()).toBe('teal-light');
    expect(document.documentElement.dataset['palette']).toBe('teal');
  });
});
