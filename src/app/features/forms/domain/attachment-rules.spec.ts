import { attachmentRule } from './attachment-rules';
describe('Attachment client hints', () => {
  const file = { type: 'image/png', size: 4 };
  it('uses explicit upload kind and exact producer MIME membership', () => {
    expect(
      attachmentRule(file, 'file', '', [], { allowed_kinds: ['image'] }),
    ).toContain('upload type');
    expect(
      attachmentRule(file, 'image', '', [], {
        allowed_kinds: ['image'],
        allowed_mime_types: ['image/webp'],
      }),
    ).toBe('');
    expect(
      attachmentRule({ type: 'image/png', size: 500 }, 'image', '', [], {
        max_item_bytes: 100,
        max_total_bytes: 100,
      }),
    ).toBe('');
    expect(
      attachmentRule(file, 'image', '', [], {
        allowed_mime_types: ['image/*'],
      }),
    ).toContain('WebP');
  });
  it('preserves literal zero count and rejects missing required caption', () => {
    expect(attachmentRule(file, 'file', '', [], { max_items: 0 })).toContain(
      'attachment limit',
    );
    expect(
      attachmentRule(file, 'file', ' ', [], { caption_required: true }),
    ).toContain('caption');
  });
  it('excludes the replaced file from count and total while retaining per-item limits', () => {
    const existing = [{ ref: 'old', size: 4 }];
    expect(
      attachmentRule(
        file,
        'file',
        '',
        existing,
        { max_items: 1, max_total_bytes: 4 },
        'old',
      ),
    ).toBe('');
    expect(
      attachmentRule(file, 'file', '', existing, { max_total_bytes: 7 }),
    ).toContain('total size');
    expect(
      attachmentRule(file, 'file', '', existing, { max_item_bytes: 3 }, 'old'),
    ).toContain('per-file');
  });
});
