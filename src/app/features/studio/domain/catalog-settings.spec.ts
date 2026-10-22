import { catalogSettingsErrors } from './catalog-settings';
describe('Catalog business settings', () => {
  it('retains omission and explicit removal while rejecting incomplete restrictions', () => {
    expect(catalogSettingsErrors('request-types', {})).toEqual({});
    expect(
      catalogSettingsErrors('request-types', { client_targets: [] }),
    ).toEqual({});
    expect(
      catalogSettingsErrors('request-types', {
        client_targets: [{ client_ref_id: '' }],
      }),
    ).toHaveProperty('client_targets');
    expect(
      catalogSettingsErrors('request-types', {
        client_targets: [{ client_ref_id: 'current', minimum_release: null }],
      }),
    ).toEqual({});
  });
  it('rejects blank, duplicated and overlong capabilities without trimming the payload', () => {
    for (const capabilities of [
      ['forms/1', ''],
      ['forms/1', 'forms/1'],
      ['x'.repeat(129)],
    ]) {
      expect(
        catalogSettingsErrors('client-releases', {
          renderer_capabilities: capabilities,
        }),
      ).toHaveProperty('renderer_capabilities');
    }
    expect(
      catalogSettingsErrors('client-releases', {
        renderer_capabilities: ['forms/1', 'media/1'],
      }),
    ).toEqual({});
  });
});
