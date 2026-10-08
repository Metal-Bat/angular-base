import { TestBed } from '@angular/core/testing';
import { ColorScheme, themePalettes } from './color-scheme';
describe('Named workspace themes', () => {
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
