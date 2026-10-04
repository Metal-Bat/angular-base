import { readPinnedFormVersion } from '../application/form-version-reader';
import { readFormVersionIdentity } from './form-version-adapter';

describe('Form version adapter and use case', () => {
  it('preserves opaque identities and projects away authoring document content', async () => {
    const dto = {
      form_ref_id: 'form/opaque?one',
      ref_id: 'version/opaque%two',
      number: 3,
      data_schema: { properties: { private_note: {} } },
      render_schema: {},
    };
    const reader = {
      readVersion: async (): Promise<
        ReturnType<typeof readFormVersionIdentity>
      > => readFormVersionIdentity(dto),
    };
    const result = await readPinnedFormVersion(reader, 'version/opaque%two');
    expect(result).toEqual({
      definitionReference: 'form/opaque?one',
      versionReference: 'version/opaque%two',
      number: 3,
    });
    expect(dto.data_schema.properties.private_note).toEqual({});
  });

  it('rejects a response for a newer version instead of moving the pin', async () => {
    const reader = {
      readVersion: async (): Promise<
        ReturnType<typeof readFormVersionIdentity>
      > =>
        readFormVersionIdentity({
          form_ref_id: 'form',
          ref_id: 'newer',
          number: 2,
        }),
    };
    await expect(readPinnedFormVersion(reader, 'pinned')).rejects.toThrow(
      'pinned reference',
    );
  });

  it.each([
    null,
    {},
    { form_ref_id: 'form', ref_id: '', number: 1 },
    { form_ref_id: 'form', ref_id: 'version', number: 1.5 },
    { form_ref_id: 'form', ref_id: 'version', number: 0 },
  ])('rejects malformed identity %j', (value) => {
    expect(() => readFormVersionIdentity(value)).toThrow(
      'Invalid form version identity',
    );
  });
});
