import { OptionCoordinator, OptionPage } from './option-coordinator';
const result = (
  generation: number,
  revision = 'v1',
  fingerprint = 'dep1',
): OptionPage => ({
  generation,
  revision,
  fingerprint,
  locale: 'en',
  state: 'READY',
  items: [{ key: 'json:1', value: 'One' }],
  page: 1,
  totalPages: 2,
});
describe('Dependent options concurrency', () => {
  it('ignores out-of-order dependency responses and cancels obsolete reads', async () => {
    const replies: ((page: OptionPage) => void)[] = [];
    const signals: AbortSignal[] = [];
    const source = new OptionCoordinator((_input, _generation, abort) => {
      signals.push(abort);
      return new Promise((resolve) => replies.push(resolve));
    });
    const input = {
      data: { parent: 1 },
      locale: 'en',
      page: 1,
      search: '',
      selected: [],
    };
    const first = source.load(input);
    const second = source.load({ ...input, data: { parent: 2 } });
    expect(signals[0].aborted).toBe(true);
    replies[1](result(2, 'v1', 'dep2'));
    expect((await second)?.fingerprint).toBe('dep2');
    replies[0](result(1));
    expect(await first).toBeNull();
  });
  it('rejects changed pagination snapshots and checks locale generation', async () => {
    let revision = 'v1';
    let fingerprint = 'dep1';
    let locale = 'en';
    const source = new OptionCoordinator(async (_input, generation) => ({
      ...result(generation, revision, fingerprint),
      locale,
    }));
    const input = { data: {}, locale: 'en', page: 1, search: '', selected: [] };
    await source.load(input);
    revision = 'v2';
    await expect(source.load({ ...input, page: 2 })).rejects.toThrow('changed');
    revision = 'v1';
    fingerprint = 'other';
    await expect(source.load(input)).rejects.toThrow('changed');
    locale = 'fa';
    await expect(
      source.load({ ...input, data: { changed: 1 } }),
    ).rejects.toThrow('Stale');
  });
  it('keeps selected typed values outside option-loading state and closes on cleanup', async () => {
    const input = {
      data: { choice: false },
      locale: 'en',
      page: 1,
      search: '',
      selected: ['json:false'],
    };
    const source = new OptionCoordinator(async (_input, generation) =>
      result(generation),
    );
    const work = source.load(input);
    source.close();
    expect(await work).toBeNull();
    expect(input.data.choice).toBe(false);
  });
});
