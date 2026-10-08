import { availableTaskActions } from './task-affordances';
const actions = [{ key: 'approve', kind: 'complete' }] as const;
describe('Current item action affordances', () => {
  it.each(['COMPLETED', 'CANCELLED', 'RETURNED', 'PENDING', 'UNKNOWN'])(
    'hides completion for inactive lifecycle %s',
    (status) => {
      expect(
        availableTaskActions({
          status,
          purpose: 'edit',
          isCurrentClaimant: true,
          actions,
        }),
      ).toEqual([]);
    },
  );
  it.each(['observer', 'summary', 'print'])(
    'hides all commands for %s views',
    (purpose) => {
      expect(
        availableTaskActions({
          status: 'CLAIMED',
          purpose,
          isCurrentClaimant: true,
          actions,
        }),
      ).toEqual([]);
    },
  );
  it('hides commands for non-claimants and never invents a server action', () => {
    expect(
      availableTaskActions({
        status: 'CLAIMED',
        purpose: 'edit',
        isCurrentClaimant: false,
        actions,
      }),
    ).toEqual([]);
    expect(
      availableTaskActions({
        status: 'IN_PROGRESS',
        purpose: 'edit',
        isCurrentClaimant: true,
        actions: [],
      }),
    ).toEqual([]);
    expect(
      availableTaskActions({
        status: 'IN_PROGRESS',
        purpose: 'edit',
        isCurrentClaimant: true,
        actions,
      }),
    ).toBe(actions);
  });
});
