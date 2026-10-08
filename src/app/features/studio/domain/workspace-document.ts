import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { parseDocument, Point, Workspace } from './authoring';
function object(value: JsonValue | undefined): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw Error('Invalid workspace object');
  }
  return value as JsonObject;
}
function point(value: JsonValue): Point {
  const raw = object(value);
  if (
    typeof raw['x'] !== 'number' ||
    typeof raw['y'] !== 'number' ||
    !Number.isFinite(raw['x']) ||
    !Number.isFinite(raw['y']) ||
    Math.abs(raw['x']) > 1000000 ||
    Math.abs(raw['y']) > 1000000
  ) {
    throw Error('Invalid workspace position');
  }
  return { x: raw['x'], y: raw['y'] };
}
function keyed(value: JsonValue | undefined, maximum: number): JsonObject {
  const raw = object(value);
  if (
    Object.keys(raw).length > maximum ||
    Object.keys(raw).some((key) => !key.length || key.length > 128)
  ) {
    throw Error('Invalid workspace keys');
  }
  return raw;
}
export function readWorkspace(input: unknown): Workspace {
  const raw = parseDocument(JSON.stringify(input));
  if (raw['dialect'] !== 'bpms.workspace/1') {
    throw Error('Unsupported workspace dialect');
  }
  const viewport = object(raw['viewport']);
  const zoom = viewport['zoom'];
  if (
    typeof zoom !== 'number' ||
    !Number.isFinite(zoom) ||
    zoom < 0.1 ||
    zoom > 4
  ) {
    throw Error('Invalid zoom');
  }
  const collapsed = raw['collapsed'];
  if (
    !Array.isArray(collapsed) ||
    collapsed.length > 256 ||
    new Set(collapsed).size !== collapsed.length ||
    collapsed.some(
      (key) => typeof key !== 'string' || !key.length || key.length > 128,
    )
  ) {
    throw Error('Invalid collapsed keys');
  }
  const positions = Object.fromEntries(
    Object.entries(keyed(raw['positions'], 256)).map(([key, value]) => [
      key,
      point(value),
    ]),
  );
  const routing = Object.fromEntries(
    Object.entries(keyed(raw['routing'], 2048)).map(([key, value]) => {
      if (!Array.isArray(value) || value.length > 64) {
        throw Error('Invalid edge routing');
      }
      return [key, value.map(point)];
    }),
  );
  return {
    dialect: 'bpms.workspace/1',
    graph: object(raw['graph']),
    viewport: { ...point(viewport), zoom },
    positions,
    collapsed: collapsed as string[],
    routing,
  };
}
