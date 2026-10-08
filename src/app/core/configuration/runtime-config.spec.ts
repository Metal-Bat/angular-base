import {
  defaultRuntimeConfig,
  loadRuntimeConfig,
  readRuntimeConfig,
} from './runtime-config';

describe('Public runtime configuration', () => {
  it('accepts an explicit same-origin configuration without advertising an unbuilt renderer', () => {
    expect(readRuntimeConfig(defaultRuntimeConfig)).toEqual(
      defaultRuntimeConfig,
    );
  });
  it('accepts Arabic as the initial UI language', () => {
    expect(
      readRuntimeConfig({ ...defaultRuntimeConfig, locale: 'ar' }).locale,
    ).toBe('ar');
  });
  it.each([
    { ...defaultRuntimeConfig, locale: 'unknown' },
    { ...defaultRuntimeConfig, client_secret: 'fixture-secret' },
    { ...defaultRuntimeConfig, apiBasePath: 'https://other.example/api/v1' },
    { ...defaultRuntimeConfig, rendererCapabilities: ['javascript:alert(1)'] },
    { ...defaultRuntimeConfig, rendererCapabilities: ['primitive.unknown/1'] },
    null,
  ])('rejects undeclared or unsafe configuration %j', (config) => {
    expect(() => readRuntimeConfig(config)).toThrow(
      'Invalid runtime configuration',
    );
  });
  it('fetches configuration without caching and rejects failed responses', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(defaultRuntimeConfig)));
    await expect(loadRuntimeConfig(fetcher)).resolves.toEqual(
      defaultRuntimeConfig,
    );
    expect(fetcher).toHaveBeenCalledWith('/runtime-config.json', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    fetcher.mockResolvedValue(new Response('', { status: 503 }));
    await expect(loadRuntimeConfig(fetcher)).rejects.toThrow('unavailable');
  });
});
