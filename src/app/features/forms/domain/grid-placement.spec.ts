import { gridPlacement } from './grid-placement';
import { RenderNode } from './runtime-document';
const node: RenderNode = {
  component: 'text',
  key: 'field',
  scope: '/properties/name',
  label: 'Name',
  renderer: 'default',
  display: { grid: { column: 2, span: 3, row: 4 } },
  children: [],
};
describe('Responsive grid coordinates', () => {
  it('uses bounded contract coordinates and reflows into configured tracks', () => {
    expect(gridPlacement(node, 12)).toEqual({ column: '2 / span 3', row: '4' });
    expect(gridPlacement(node, 3)).toEqual({ column: '2 / span 2', row: '4' });
    expect(gridPlacement(node, 1)).toEqual({ column: '1 / span 1', row: '4' });
    expect(node.display['grid']).toEqual({ column: 2, span: 3, row: 4 });
  });
  it('does not generate CSS from invalid or unsupported metadata', () => {
    expect(
      gridPlacement({ ...node, display: { grid: { column: 12, span: 2 } } }, 3),
    ).toEqual({ column: 'auto', row: 'auto' });
    expect(gridPlacement({ ...node, display: {} }, 3)).toEqual({
      column: 'auto',
      row: 'auto',
    });
  });
});
