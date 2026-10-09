import { Workspace } from './authoring';
import { CanvasNode, graphSteps } from './workflow-authoring';
import { JsonObject } from '../../forms/domain/runtime-document';
export function nodeModels(
  workspace: Workspace,
  catalog: readonly JsonObject[],
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
    const ports = Array.isArray(metadata?.['ports'])
      ? (metadata!['ports'] as JsonObject[]).map((port) => ({
          key: String(port['port_key']),
          cardinality:
            typeof port['cardinality'] === 'string'
              ? port['cardinality']
              : undefined,
          direction: String(port['direction']),
          schema: (port['value_schema'] ?? {}) as JsonObject,
        }))
      : [];
    return {
      key: String(step['key']),
      title: String(step['type_code']),
      position: workspace.positions[String(step['key'])] ?? {
        x: 40 + (index % 4) * 280,
        y: 40 + Math.floor(index / 4) * 240,
      },
      ports,
    };
  });
}
