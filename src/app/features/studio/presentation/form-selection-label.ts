import { behaviorNodes } from '../../forms/domain/resolved-behavior';
import { nodeLabel } from '../../forms/domain/node-label';
import {
  JsonObject,
  RenderNode,
  RuntimeDocument,
} from '../../forms/domain/runtime-document';
import { authoredNode, outline, OutlineItem } from '../domain/form-authoring';
import { renderOf } from '../domain/form-editing';

/** Read the server-resolved label; do not implement another message resolver. */
export function placementLabel(
  authored: JsonObject,
  resolved?: RenderNode,
): string {
  return (
    nodeLabel(
      resolved ?? {
        label: typeof authored['label'] === 'string' ? authored['label'] : null,
        scope: typeof authored['scope'] === 'string' ? authored['scope'] : null,
        display: authored,
      },
    ) || String(authored['component'])
  );
}
export function selectionLabel(view: {
  documents(): JsonObject;
  selected(): readonly number[];
  runtime(): RuntimeDocument | null;
  previewFreshness(): string;
}): string {
  const authored = authoredNode(renderOf(view.documents()), view.selected());
  const runtime = view.previewFreshness() === 'ready' ? view.runtime() : null;
  const key = authored['node_key'];
  return placementLabel(
    authored,
    runtime && typeof key === 'string' && key
      ? behaviorNodes(runtime.render).find((node) => node.key === key)
      : undefined,
  );
}

/** Label current authored placements with the same authorized runtime projection as design. */
export function presentationOutline(
  render: JsonObject,
  resolved: RenderNode | null,
): OutlineItem[] {
  const labels = new Map(
    resolved ? behaviorNodes(resolved).map((node) => [node.key, node]) : [],
  );
  return outline(render).map((item) => ({
    ...item,
    label: placementLabel(
      authoredNode(render, item.path),
      labels.get(item.identity),
    ),
  }));
}
export function formOutline(view: {
  documents(): JsonObject;
  runtime(): RuntimeDocument | null;
  previewFreshness(): string;
}): OutlineItem[] {
  return presentationOutline(
    renderOf(view.documents()),
    view.previewFreshness() === 'ready'
      ? (view.runtime()?.render ?? null)
      : null,
  );
}
