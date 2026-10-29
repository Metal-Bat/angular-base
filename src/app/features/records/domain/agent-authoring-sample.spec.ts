import { authorSample } from './agent-authoring-sample';
describe('Author-provided Agent samples', () => {
  it('distinguishes omitted values, explicit false and zero, and an empty choice list', () => {
    expect(
      authorSample(
        [
          { key: 'flag', kind: 'boolean' },
          { key: 'count', kind: 'number' },
          { key: 'routes', kind: 'choices' },
        ],
        ['flag', 'count', 'routes'],
        { flag: false, count: '0' },
        [],
      ),
    ).toEqual({ flag: false, count: 0, routes: [] });
    expect(
      authorSample([{ key: 'flag', kind: 'boolean' }], [], { flag: false }, []),
    ).toEqual({});
    expect(() =>
      authorSample(
        [{ key: 'count', kind: 'number' }],
        ['count'],
        { count: '' },
        [],
      ),
    ).toThrow();
  });
  it('keeps an incomplete required description correctable as text without inventing nullable JSON', () => {
    expect(
      authorSample([{ key: 'routes', kind: 'choices' }], ['routes'], {}, [
        {
          row: 'sample-row',
          key: 'finance',
          en: 'Finance',
          fa: '',
          ar: '',
          description: '',
        },
      ]),
    ).toEqual({
      routes: [{ key: 'finance', labels: { en: 'Finance' }, description: '' }],
    });
  });
});
