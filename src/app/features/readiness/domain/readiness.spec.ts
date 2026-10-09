import { ReadinessCheck, readinessStatus } from './readiness';
describe('Required readiness aggregation', () => {
  const check: ReadinessCheck = {
    key: 'graph',
    label: 'Graph',
    category: 'definition',
    required: true,
    status: 'ready',
    reason: '',
  };
  it('never interprets no result or an unknown required check as ready', () => {
    expect(readinessStatus([])).toBe('unknown');
    expect(readinessStatus([{ ...check, status: 'unknown' }])).toBe('unknown');
    expect(
      readinessStatus([
        { ...check, status: 'unrecognised' as ReadinessCheck['status'] },
      ]),
    ).toBe('unknown');
  });
  it('honors blockers while separating optional and non-applicable checks', () => {
    expect(
      readinessStatus([
        check,
        { ...check, key: 'provider', status: 'blocked' },
      ]),
    ).toBe('blocked');
    expect(
      readinessStatus([
        check,
        { ...check, key: 'optional', required: false, status: 'blocked' },
      ]),
    ).toBe('ready');
    expect(
      readinessStatus([
        check,
        { ...check, key: 'n/a', status: 'not_applicable' },
      ]),
    ).toBe('ready');
  });
});
