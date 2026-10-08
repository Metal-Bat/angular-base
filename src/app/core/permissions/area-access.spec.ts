import { canEnterArea, hasPermissions } from './area-access';
import { safeReturnPath } from '../auth/safe-return-path';
describe('Authoritative capability boundaries', () => {
  it.each([
    [['requests.start'], [true, false, true]],
    [['forms.manage'], [false, true, true]],
    [['admin.users.manage'], [false, false, true]],
    [['*'], [true, true, true]],
    [[], [false, false, false]],
  ] as const)('gates disjoint capabilities %j', (permissions, expected) => {
    expect(
      (['operations', 'studio', 'administration'] as const).map((area) =>
        canEnterArea(permissions, area),
      ),
    ).toEqual(expected);
  });
  it('requires every mandatory capability, independent of group membership', () => {
    expect(
      hasPermissions(['review-team', 'requests.start'], ['tasks.complete']),
    ).toBe(false);
  });
  it.each([
    'https://evil.invalid',
    '//evil.invalid',
    '/login',
    '/operations/../login',
    '/operations/%2e%2e/login',
    '/operations/\\evil',
    '/operations/%00',
    '/operations%2Fanything',
  ])('rejects unsafe return path %s', (path) => {
    expect(safeReturnPath(path)).toBeNull();
  });
  it('preserves encoded opaque references and local query parameters', () => {
    expect(safeReturnPath('/operations/cases/opaque%2Fref?view=summary')).toBe(
      '/operations/cases/opaque%2Fref?view=summary',
    );
  });
});
