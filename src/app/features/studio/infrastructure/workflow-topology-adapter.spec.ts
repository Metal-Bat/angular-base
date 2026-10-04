import { readWorkflowTopology } from './workflow-topology-adapter';

describe('Workflow topology adapter', () => {
  it('preserves conditional/default branches without evaluating expressions or adding canvas layout', () => {
    const dto = {
      steps: [
        {
          key: 'review',
          type_code: 'HUMAN_TASK',
          type_version_ref: 'step/type?rev=1',
          config: { private: true },
        },
      ],
      transitions: [
        {
          source: 'review',
          target: 'end',
          outcome: 'custom-outcome',
          condition: 'amount > 10',
          priority: 2,
        },
        {
          source: 'review',
          target: 'end',
          outcome: 'custom-outcome',
          condition: null,
          is_default: true,
        },
      ],
    };
    const before = structuredClone(dto);
    expect(readWorkflowTopology(dto)).toEqual({
      steps: [
        {
          key: 'review',
          typeCode: 'HUMAN_TASK',
          typeVersionReference: 'step/type?rev=1',
        },
      ],
      transitions: [
        {
          source: 'review',
          target: 'end',
          outcome: 'custom-outcome',
          condition: 'amount > 10',
          priority: 2,
          isDefault: false,
        },
        {
          source: 'review',
          target: 'end',
          outcome: 'custom-outcome',
          condition: null,
          priority: 0,
          isDefault: true,
        },
      ],
    });
    expect(dto).toEqual(before);
  });

  it('supports omitted optional arrays in the supplied snapshot contract', () => {
    expect(readWorkflowTopology({})).toEqual({ steps: [], transitions: [] });
  });

  it.each([
    null,
    { steps: {} },
    { transitions: null },
    { steps: [{ key: 'a' }] },
    {
      transitions: [{ source: 'a', target: 'b', outcome: 'ok', priority: -1 }],
    },
  ])('rejects malformed topology %j', (value) => {
    expect(() => readWorkflowTopology(value)).toThrow(
      'Invalid workflow topology',
    );
  });
});
