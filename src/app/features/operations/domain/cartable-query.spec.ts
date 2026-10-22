import { CartableDraft, cartableQuery } from './cartable-query';

const draft: CartableDraft = {
  status: 'CLAIMED',
  time: 'closed_at',
  size: 50,
  after: '2026-10-17T08:00:00+03:30',
  before: '2026-10-18T00:00:00Z',
  overdue: '',
};
describe('Typed cartable query', () => {
  it('preserves the queue and exact inclusive/exclusive instants without SearchRequest fields', () => {
    expect(cartableQuery({ cartable: 'claimed', page: 3 }, draft)).toEqual({
      cartable: 'claimed',
      page: 1,
      size: 50,
      time_field: 'closed_at',
      status: 'CLAIMED',
      after: draft.after,
      before: draft.before,
      overdue_before: null,
    });
  });
  it.each([
    { after: '2026-10-17T08:00' },
    { before: '2026-10-16T00:00:00Z' },
    { size: 0 },
    { size: 101 },
    { status: 'invented' },
    { time: 'due_at' },
  ])(
    'rejects invalid query values while leaving the draft intact: %s',
    (patch) => {
      const invalid = { ...draft, ...patch };
      const snapshot = structuredClone(invalid);
      expect(() => cartableQuery(null, invalid)).toThrow();
      expect(invalid).toEqual(snapshot);
    },
  );
});
