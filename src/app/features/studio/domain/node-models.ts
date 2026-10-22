import { subprocessRouteChoices } from './subprocess-routes';
import { transformSchemas } from './transform-contract';
import { inspectorFor } from './node-inspector';
import { stepTypeTitle, workflowStepName } from './workflow-labels';
import { Workspace } from './authoring';
import { CanvasNode, graphSteps } from './workflow-authoring';
import { JsonObject } from '../../forms/domain/runtime-document';
export function nodeModels(
  workspace: Workspace,
  catalog: readonly JsonObject[],
  children: readonly JsonObject[] = [],
): CanvasNode[] {
  let steps: readonly JsonObject[];
  try {
    steps = graphSteps(workspace.graph);
  } catch {
    return [];
  }
  return steps.map((step, index) => {
    const entry = catalog.find(
      (row) =>
        (row['metadata'] as JsonObject | undefined)?.['ref_id'] ===
        step['type_version_ref'],
    );
    const metadata = entry?.['metadata'] as JsonObject | undefined;
    const inspector = inspectorFor(step, catalog);
    const subprocess = inspector?.handler_key === 'subprocess';
    const child = subprocessRouteChoices(workspace.graph, step, children);
    const transform =
      inspector?.handler_key === 'transform' &&
      inspector.handler_version === '2'
        ? transformSchemas((step['config'] ?? {}) as JsonObject)
        : null;
    const ports = Array.isArray(metadata?.['ports'])
      ? (metadata!['ports'] as JsonObject[]).map((port) => ({
          key: String(port['port_key']),
          cardinality:
            typeof port['cardinality'] === 'string'
              ? port['cardinality']
              : undefined,
          direction: String(port['direction']),
          schema:
            transform &&
            port['port_key'] ===
              (port['direction'] === 'INPUT' ? 'value' : 'result')
              ? transform[port['direction'] === 'INPUT' ? 0 : 1]
              : ((port['value_schema'] ?? {}) as JsonObject),
        }))
      : [];
    return {
      key: String(step['key']),
      canContinue:
        !!inspector && inspector.handler_key !== 'finish' && child.available,
      title: workflowStepName(String(step['key'])),
      typeTitle: stepTypeTitle(entry, String(step['type_code'])),
      position: workspace.positions[String(step['key'])] ?? {
        x: 40 + (index % 4) * 280,
        y: 40 + Math.floor(index / 4) * 240,
      },
      ports,
      outcomes: [
        ...new Set([
          ...(subprocess ? child.outcomes : (inspector?.outcomes ?? [])),
          ...(
            (subprocess
              ? []
              : ((step['task_contract'] as JsonObject | undefined)?.[
                  'actions'
                ] ?? [])) as JsonObject[]
          )
            .map((action) => action['outcome_key'])
            .filter((key): key is string => typeof key === 'string' && !!key),
        ]),
      ],
    };
  });
}
