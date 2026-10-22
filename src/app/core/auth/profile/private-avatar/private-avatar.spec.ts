import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../actor-state';
import { BinaryTransfer } from '../../../transport/binary-transfer';
import { PrivateAvatar } from './private-avatar';

describe('Private avatar byte ownership', () => {
  const originalCreate = Object.getOwnPropertyDescriptor(
    URL,
    'createObjectURL',
  );
  const originalRevoke = Object.getOwnPropertyDescriptor(
    URL,
    'revokeObjectURL',
  );
  const create = vi.fn(() => 'blob:owned-avatar');
  const revoke = vi.fn();
  const run = vi.fn();
  const cancel = vi.fn();
  beforeEach(() => {
    create.mockClear();
    revoke.mockClear();
    run.mockReset();
    cancel.mockClear();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: create,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revoke,
    });
    TestBed.overrideComponent(PrivateAvatar, {
      set: {
        providers: [{ provide: BinaryTransfer, useValue: { run, cancel } }],
      },
    });
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    for (const [key, descriptor] of [
      ['createObjectURL', originalCreate],
      ['revokeObjectURL', originalRevoke],
    ] as const) {
      if (descriptor) {
        Object.defineProperty(URL, key, descriptor);
      } else {
        Reflect.deleteProperty(URL, key);
      }
    }
  });
  it('previews a local selection without network access and revokes its bytes once on actor loss', async () => {
    const fixture = TestBed.createComponent(PrivateAvatar);
    fixture.componentRef.setInput(
      'file',
      new File(['owned'], 'avatar.png', { type: 'image/png' }),
    );
    await fixture.whenStable();
    expect(run).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('img').src).toBe(
      'blob:owned-avatar',
    );
    TestBed.inject(ActorState).reset();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:owned-avatar');
    fixture.destroy();
    expect(revoke).toHaveBeenCalledTimes(1);
  });
  it('ignores private download bytes that arrive after actor cleanup', async () => {
    let finish!: (response: HttpResponse<Blob>) => void;
    run.mockImplementationOnce(
      () =>
        new Promise<HttpResponse<Blob>>((resolve) => {
          finish = resolve;
        }),
    );
    const fixture = TestBed.createComponent(PrivateAvatar);
    fixture.componentRef.setInput('reference', 'authorized-image');
    await fixture.whenStable();
    expect(run).toHaveBeenCalledExactlyOnceWith(
      'download_image_api_v1_media_images__ref_id__get',
      { path: { ref_id: 'authorized-image' } },
    );
    TestBed.inject(ActorState).reset();
    finish(
      new HttpResponse({ body: new Blob(['private'], { type: 'image/png' }) }),
    );
    await fixture.whenStable();
    expect(create).not.toHaveBeenCalled();
    expect(fixture.componentInstance.source()).toBe('');
    expect(fixture.nativeElement.textContent).not.toContain('authorized-image');
  });
  it('does not render unauthorized or non-image responses as an avatar', async () => {
    run.mockResolvedValueOnce(
      new HttpResponse({
        body: new Blob(['denied'], { type: 'application/json' }),
      }),
    );
    const fixture = TestBed.createComponent(PrivateAvatar);
    fixture.componentRef.setInput('reference', 'private-image');
    await fixture.whenStable();
    expect(create).not.toHaveBeenCalled();
    expect(fixture.componentInstance.state()).toBe('failed');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });
});
