import { fitAccessibleNodes } from './canvas-fit';

it('fits the final node while preserving physical socket sizes during zoom-out', () => {
  const nodes = [0, 240, 480].map((y) => ({
    x: 0,
    y,
    width: 240,
    height: 210,
    rows: Array.from({ length: 4 }, () => ({ height: 28.8, minimum: 25 })),
  }));
  const before = structuredClone(nodes);
  const result = fitAccessibleNodes(nodes, { width: 1000, height: 600 }, 1);
  // At this scale all four rows retain 25 physical pixels. The remaining
  // world-space bottom is 480 + 210 - 4*28.8 = 574.8 pixels.
  expect(result.zoom).toBeCloseTo(420 / 574.8, 8);
  expect(result.y).toBeCloseTo(40, 8);
  expect(nodes).toEqual(before);
});

it('retains the existing minimum zoom when the graph cannot physically fit', () => {
  const result = fitAccessibleNodes(
    [
      {
        x: -40,
        y: -20,
        width: 240,
        height: 300,
        rows: Array.from({ length: 8 }, () => ({ height: 30, minimum: 25 })),
      },
    ],
    { width: 400, height: 120 },
    0.5,
  );
  expect(result.zoom).toBe(0.1);
  expect(Number.isFinite(result.x) && Number.isFinite(result.y)).toBe(true);
});
