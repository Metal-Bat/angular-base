import { CanvasNode } from './workflow-authoring';
export function selectablePorts(
  nodes: readonly CanvasNode[],
  direction: 'INPUT' | 'OUTPUT',
): { value: string; label: string }[] {
  const role = direction === 'INPUT' ? 'in' : 'out';
  return nodes.flatMap((node) => [
    {
      value: 'control:' + node.key + ':' + role,
      label:
        node.title +
        ' · ' +
        node.key +
        ' · ' +
        (direction === 'INPUT' ? 'Control in' : 'Control out'),
    },
    ...node.ports
      .filter((port) => port.direction === direction)
      .map((port) => ({
        value: 'data:' + node.key + ':' + role + ':' + port.key,
        label:
          node.title +
          ' · ' +
          node.key +
          ' · ' +
          port.key +
          ' · ' +
          String(port.schema['type'] ?? ''),
      })),
  ]);
}
