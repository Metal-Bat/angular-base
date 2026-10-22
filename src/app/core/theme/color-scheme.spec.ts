import { TestBed } from '@angular/core/testing';
import { ColorScheme, themePalettes, themeStorageKey } from './color-scheme';
import { ActorState } from '../auth/actor-state';
describe('Named workspace themes', () => {
  beforeEach(() => localStorage.removeItem(themeStorageKey));
  it('retains only the selected public theme across actor cleanup', () => {
    const scheme = TestBed.inject(ColorScheme);
    scheme.select('rose-dark');
    TestBed.inject(ActorState).reset();
    expect(scheme.selected()).toBe('rose-dark');
    expect(scheme.mode()).toBe('dark');
    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
    expect(localStorage.getItem(themeStorageKey)).toBe('rose-dark');
  });
  it('restores a validated browser theme before login and ignores private or malformed cache fields', () => {
    localStorage.setItem(themeStorageKey, 'teal-dark');
    expect(TestBed.inject(ColorScheme).selected()).toBe('teal-dark');
    TestBed.resetTestingModule();
    document.documentElement.classList.remove('app-dark');
    localStorage.setItem(
      themeStorageKey,
      JSON.stringify({ palette: 'rose', mode: 'dark', actor: 'private' }),
    );
    expect(TestBed.inject(ColorScheme).selected()).toBe('blue-light');
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
    localStorage.removeItem(themeStorageKey);
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
  it('ignores unknown options and preserves the palette when changing modes', () => {
    const scheme = TestBed.inject(ColorScheme);
    scheme.select('teal-dark');
    scheme.select('invalid-light');
    expect(scheme.selected()).toBe('teal-dark');
    scheme.setMode('light');
    expect(scheme.selected()).toBe('teal-light');
    expect(document.documentElement.dataset['palette']).toBe('teal');
  });
});
