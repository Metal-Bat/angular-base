import { processStatuses } from '../domain/process-tracking';
import { tracking } from './process-decoder';
describe('Authorized process tracking', () => {
  const snapshot = (status: string): Record<string, unknown> => ({
    process_ref_id: 'process',
    business_request_ref_id: 'request',
    status,
    current_positions: [],
    steps: [],
    children: [],
    events: { items: [], page: 1, size: 20, total: 0, total_pages: 0 },
    coverage_started_at: null,
  });
  it.each(processStatuses)(
    'accepts the declared %s lifecycle state',
    (status) => {
      expect(
        tracking({ workflow_version_ref_id: 'workflow' }, snapshot(status))
          .status,
      ).toBe(status);
    },
  );
  it('rejects unknown statuses and bounds tracking lists', () => {
    expect(() => tracking({}, snapshot('UNKNOWN'))).toThrow();
    expect(() =>
      tracking(
        { workflow_version_ref_id: 'workflow' },
        { ...snapshot('WAITING'), steps: Array(1001).fill({}) },
      ),
    ).toThrow();
  });
  it('does not carry authoring configuration into the view model', () => {
    const result = tracking(
      { workflow_version_ref_id: 'workflow', graph: { secret: 'private' } },
      { ...snapshot('WAITING'), authoring: { secret: 'private' } },
    );
    expect(JSON.stringify(result)).not.toContain('private');
  });
});
