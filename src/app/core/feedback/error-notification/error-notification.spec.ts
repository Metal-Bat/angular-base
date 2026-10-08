import { Clipboard } from '@angular/cdk/clipboard';
import { TestBed } from '@angular/core/testing';
import { ApiFailure } from '../../transport/api-failure';
import { RequestErrors } from '../request-errors';
import { ErrorNotification } from './error-notification';

describe('Copyable error notification', () => {
  const fallback = { copy: vi.fn(() => true) };
  beforeEach(() => {
    fallback.copy.mockReset().mockReturnValue(true);
    TestBed.configureTestingModule({
      imports: [ErrorNotification],
      providers: [{ provide: Clipboard, useValue: fallback }],
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('copies only the exact code and announces success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const fixture = TestBed.createComponent(ErrorNotification);
    const errors = TestBed.inject(RequestErrors);
    errors.show(new ApiFailure(400, '001_CODE', 'private-request-id', []));
    fixture.detectChanges();
    await fixture.componentInstance.copy(errors.notice()!);
    expect(writeText).toHaveBeenCalledWith('001_CODE');
    expect(fallback.copy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.copyStatus()).toBe('Copied to clipboard');
  });

  it('falls back when clipboard access is denied and reports a failed copy honestly', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(Error('denied')) },
    });
    fallback.copy.mockReturnValue(false);
    const fixture = TestBed.createComponent(ErrorNotification);
    const errors = TestBed.inject(RequestErrors);
    errors.show(new ApiFailure(400, 123, null, []));
    fixture.detectChanges();
    await fixture.componentInstance.copy(errors.notice()!);
    expect(fallback.copy).toHaveBeenCalledWith('123');
    expect(fixture.componentInstance.copied()).toBe(false);
    expect(fixture.componentInstance.copyStatus()).toContain('Could not copy.');
  });

  it('does not mark a new error copied when an old clipboard write completes', async () => {
    let finish!: () => void;
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn(
          () =>
            new Promise<void>((resolve) => {
              finish = resolve;
            }),
        ),
      },
    });
    const fixture = TestBed.createComponent(ErrorNotification);
    const errors = TestBed.inject(RequestErrors);
    errors.show(new ApiFailure(400, 'OLD', null, []));
    fixture.detectChanges();
    const pending = fixture.componentInstance.copy(errors.notice()!);
    errors.show(new ApiFailure(400, 'NEW', null, []));
    fixture.detectChanges();
    finish();
    await pending;
    expect(fixture.componentInstance.copied()).toBe(false);
    expect(fixture.componentInstance.copyStatus()).toBe('');
  });
});
