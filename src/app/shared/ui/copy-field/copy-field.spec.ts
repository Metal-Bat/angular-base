import { Clipboard } from '@angular/cdk/clipboard';
import { TestBed } from '@angular/core/testing';
import { Locale } from '../../../core/localization/locale';
import { CopyField } from './copy-field';
import { ActorState } from '../../../core/auth/actor-state';

describe('Copy field lifecycle and keyboard behavior', () => {
  const fallback = vi.fn().mockReturnValue(true);
  beforeEach(() => {
    fallback.mockClear();
    TestBed.configureTestingModule({
      providers: [{ provide: Clipboard, useValue: { copy: fallback } }],
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  async function prepare(): Promise<
    ReturnType<typeof TestBed.createComponent<CopyField>>
  > {
    const fixture = TestBed.createComponent(CopyField);
    fixture.componentRef.setInput('controlId', 'owned-password');
    fixture.componentRef.setInput('label', 'Report password');
    fixture.componentRef.setInput('value', 'one-time');
    await fixture.whenStable();
    return fixture;
  }
  it('does not copy an old value through fallback after dismissal or destruction', async () => {
    let reject!: (reason: Error) => void;
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: () =>
          new Promise<void>((_, fail) => {
            reject = fail;
          }),
      },
    });
    const fixture = await prepare();
    const copying = fixture.componentInstance.copy();
    fixture.componentRef.setInput('value', '');
    await fixture.whenStable();
    reject(new Error('clipboard unavailable'));
    await copying;
    expect(fallback).not.toHaveBeenCalled();
    expect(fixture.componentInstance.status()).toBe('');
    fixture.componentRef.setInput('value', 'next');
    await fixture.whenStable();
    const second = fixture.componentInstance.copy();
    fixture.destroy();
    reject(new Error('clipboard unavailable'));
    await second;
    expect(fallback).not.toHaveBeenCalled();
  });
  it('invalidates pending fallback immediately on actor reset before the parent rerenders', async () => {
    let reject!: (reason: Error) => void;
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: () =>
          new Promise<void>((_, fail) => {
            reject = fail;
          }),
      },
    });
    const fixture = await prepare();
    const copying = fixture.componentInstance.copy();
    TestBed.inject(ActorState).reset();
    reject(new Error('clipboard unavailable'));
    await copying;
    expect(fallback).not.toHaveBeenCalled();
    expect(fixture.componentInstance.copying()).toBe(false);
    expect(fixture.componentInstance.status()).toBe('');
  });
  it('retains the named copy button and selectable value in Farsi', async () => {
    const fixture = await prepare();
    await TestBed.inject(Locale).set('fa');
    await fixture.whenStable();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    input.focus();
    input.select();
    expect(fallback).not.toHaveBeenCalled();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).not.toBe('Copy password');
    button.click();
    await fixture.whenStable();
    expect(fallback).toHaveBeenCalledWith('one-time');
    expect(fixture.componentInstance.status()).toBe('Copied to clipboard');
  });
});
