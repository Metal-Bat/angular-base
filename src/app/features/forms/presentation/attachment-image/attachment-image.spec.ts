import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { Attachment } from '../../application/form-resources';
import { FORM_RESOURCES } from '../../bindings';
import { AttachmentImage } from './attachment-image';
const image: Attachment = {
  ref: 'authorized-attachment',
  kind: 'image',
  path: '/evidence',
  caption: 'Receipt',
  contentType: 'image/png',
  size: 4,
  position: 0,
};
async function setup(item: Attachment = image): Promise<{
  fixture: ReturnType<typeof TestBed.createComponent<AttachmentImage>>;
  content: ReturnType<typeof vi.fn>;
  resolve: (blob: Blob) => void;
}> {
  let resolve!: (value: Blob) => void;
  const content = vi.fn<
    (reference: string, abort?: AbortSignal) => Promise<Blob>
  >(
    () =>
      new Promise<Blob>((done) => {
        resolve = done;
      }),
  );
  TestBed.configureTestingModule({
    providers: [
      { provide: FORM_RESOURCES, useValue: { attachmentContent: content } },
    ],
  });
  const fixture = TestBed.createComponent(AttachmentImage);
  fixture.componentRef.setInput('attachment', item);
  fixture.componentRef.setInput('owner', 'case-one');
  await fixture.whenStable();
  return { fixture, content, resolve: (blob: Blob): void => resolve(blob) };
}
describe('Authorized attachment image', () => {
  const originalCreate = Object.getOwnPropertyDescriptor(
    URL,
    'createObjectURL',
  );
  const originalRevoke = Object.getOwnPropertyDescriptor(
    URL,
    'revokeObjectURL',
  );
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:receipt'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
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
  it('reads authorized attachment content once and preserves it across unchanged metadata refreshes', async () => {
    const create = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:receipt');
    const revoke = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined);
    const { fixture, content, resolve } = await setup();
    expect(content).toHaveBeenCalledWith(image.ref, expect.any(AbortSignal));
    resolve(new Blob(['image'], { type: 'image/png' }));
    await vi.waitFor(() =>
      expect(
        fixture.nativeElement.querySelector('img')?.getAttribute('src'),
      ).toBe('blob:receipt'),
    );
    fixture.componentRef.setInput('attachment', {
      ...image,
      caption: 'Updated caption',
    });
    await fixture.whenStable();
    expect(content).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledOnce();
    expect(revoke).not.toHaveBeenCalled();
    fixture.destroy();
    expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:receipt');
  });
  it('aborts and ignores late private bytes after actor cleanup', async () => {
    const create = vi.spyOn(URL, 'createObjectURL');
    const { fixture, content, resolve } = await setup();
    const signal = content.mock.calls[0][1];
    TestBed.inject(ActorState).reset();
    expect(signal?.aborted).toBe(true);
    resolve(new Blob(['private'], { type: 'image/png' }));
    await fixture.whenStable();
    expect(create).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });
  it.each([
    { ...image, kind: 'file' as const },
    { ...image, kind: 'unknown' as const },
    { ...image, size: 11 * 1024 * 1024 },
    { ...image, contentType: 'image/svg+xml' },
  ])(
    'keeps unsupported preview metadata out of the byte transport: $kind $contentType $size',
    async (item) => {
      const { content } = await setup(item);
      expect(content).not.toHaveBeenCalled();
    },
  );
  it('rejects non-image response bytes without creating a preview URL', async () => {
    const create = vi.spyOn(URL, 'createObjectURL');
    const { fixture, resolve } = await setup();
    resolve(new Blob(['not image'], { type: 'text/plain' }));
    await fixture.whenStable();
    expect(create).not.toHaveBeenCalled();
    await vi.waitFor(() =>
      expect(fixture.nativeElement.textContent).toContain(
        'Image preview is unavailable.',
      ),
    );
  });
});
