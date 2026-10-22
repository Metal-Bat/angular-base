import { Point } from '../../domain/authoring';

export type FitNode = Point & {
  width: number;
  height: number;
  rows: readonly { height: number; minimum: number }[];
};

/** Shrinking keeps accessible sockets physical-sized, so node height is nonlinear. */
export function fitAccessibleNodes(
  nodes: readonly FitNode[],
  size: { width: number; height: number },
  currentZoom: number,
): Point & { zoom: number } {
  const left = Math.min(...nodes.map((node) => node.x));
  const top = Math.min(...nodes.map((node) => node.y));
  const width = Math.max(...nodes.map((node) => node.x + node.width)) - left;
  const height = (zoom: number): number =>
    Math.max(
      ...nodes.map(
        (node) =>
          (node.y - top + node.height) * zoom +
          node.rows.reduce(
            (growth, row) =>
              growth + Math.max(0, row.minimum - row.height * zoom),
            0,
          ),
      ),
    );
  let low = 0.1;
  let high = Math.max(low, Math.min(1, currentZoom));
  // Bisection solves monotonic geometric constraints; no asynchronous fit loop.
  for (let index = 0; index < 40; index++) {
    const zoom = (low + high) / 2;
    if (width * zoom <= size.width - 80 && height(zoom) <= size.height - 80) {
      low = zoom;
    } else {
      high = zoom;
    }
  }
  return {
    x: (size.width - width * low) / 2 - left * low,
    y: (size.height - height(low)) / 2 - top * low,
    zoom: low,
  };
}
