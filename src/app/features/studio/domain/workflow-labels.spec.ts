import { emptyWorkspace } from './authoring';
import { nodeModels } from './node-models';
import { JsonObject } from '../../forms/domain/runtime-document';
import {
  readablePalette,
  stepTypeTitle,
  workflowStepName,
} from './workflow-labels';

describe('Workflow display names', () => {
  it('humanizes a step key without rewriting its identity, pin, ports or position', () => {
    const workspace = {
      ...emptyWorkspace(),
      graph: {
        steps: [
          {
            key: 'review_purchase',
            type_code: 'HUMAN_TASK',
            type_version_ref: 'exact-type',
            config: {},
          },
        ],
      },
      positions: { review_purchase: { x: 100, y: 200 } },
    };
    const before = structuredClone(workspace);
    const nodes = nodeModels(workspace, [
      {
        key: 'HUMAN_TASK:2',
        title: 'Human task',
        metadata: {
          code: 'HUMAN_TASK',
          ref_id: 'exact-type',
          number: 2,
          ports: [
            {
              port_key: 'decision',
              direction: 'OUTPUT',
              value_schema: { type: 'string' },
            },
          ],
        },
      },
    ]);
    expect(nodes[0]).toMatchObject({
      key: 'review_purchase',
      title: 'Review Purchase',
      typeTitle: 'Human task',
      position: { x: 100, y: 200 },
      ports: [
        { key: 'decision', direction: 'OUTPUT', schema: { type: 'string' } },
      ],
    });
    expect(workspace).toEqual(before);
    expect(workflowStepName('reviewPurchase.next-step')).toBe(
      'Review Purchase Next Step',
    );
    expect(workflowStepName('TRANSFORM_1')).toBe('Transform 1');
  });
  it('keeps every exact version when display names repeat and marks unresolved producer translations', () => {
    const source: JsonObject[] = [1, 2, 3].map((number) => ({
      key: 'NOTIFICATION:' + number,
      title: 'step.notification.name',
      metadata: {
        code: 'NOTIFICATION',
        number,
        ref_id: 'pinned-' + number,
        handler_version: '1',
      },
    }));
    const before = structuredClone(source);
    const entries = readablePalette(source, 'notification');
    expect(entries).toHaveLength(3);
    expect(
      entries.map((entry) => [
        entry.title,
        entry.versionNumber,
        entry.titleMissing,
        entry.duplicateTitle,
      ]),
    ).toEqual([
      ['Notification', 1, true, true],
      ['Notification', 2, true, true],
      ['Notification', 3, true, true],
    ]);
    expect(entries.map((entry) => entry.key)).toEqual([
      'NOTIFICATION:1',
      'NOTIFICATION:2',
      'NOTIFICATION:3',
    ]);
    expect(source).toEqual(before);
  });
  it('retains actual localized catalog text and uses a readable fallback for published topology', () => {
    expect(stepTypeTitle({ title: 'تصمیم هوشمند' }, 'AI_DECISION')).toBe(
      'تصمیم هوشمند',
    );
    expect(stepTypeTitle(undefined, 'AI_DECISION')).toBe('AI Decision');
    expect(stepTypeTitle({ title: 'TRANSFORM' }, 'TRANSFORM')).toBe(
      'Transform',
    );
  });
  it('distinguishes categories sharing a title and version without changing exact keys', () => {
    const entries = readablePalette(
      ['EMAIL_NOTIFICATION', 'WEB_NOTIFICATION'].map((code) => ({
        key: code + ':1',
        title: 'Notification',
        metadata: { code, number: 1 },
      })),
      '',
    );
    expect(
      entries.map((entry) => [
        entry.title,
        entry.typeLabel,
        entry.versionNumber,
        entry.duplicateTitle,
      ]),
    ).toEqual([
      ['Notification', 'Email Notification', 1, true],
      ['Notification', 'Web Notification', 1, true],
    ]);
    expect(entries.map((entry) => entry.key)).toEqual([
      'EMAIL_NOTIFICATION:1',
      'WEB_NOTIFICATION:1',
    ]);
  });
});
