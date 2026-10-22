import { nodeLabel } from '../../forms/domain/node-label';
import { RenderNode } from '../../forms/domain/runtime-document';
import { placementLabel } from './form-selection-label';

describe('Form label parity', () => {
  const authored = {
    component: 'text',
    label: 'Old caption',
    scope: '/properties/purchase_reason',
  };
  const resolved: RenderNode = {
    component: 'text',
    label: 'Purchase reason',
    scope: authored.scope,
    key: 'stable',
    renderer: 'default',
    display: {},
    children: [],
  };
  it('uses the same server-resolved localized label for design and runtime', () => {
    for (const label of ['Purchase reason', 'علت خرید', 'سبب الشراء']) {
      const node = { ...resolved, label };
      expect(placementLabel(authored, node)).toBe(label);
      expect(nodeLabel(node)).toBe(label);
    }
  });
  it('honors an accessibility label before the ordinary caption in both surfaces', () => {
    const node = {
      ...resolved,
      display: {
        accessibility: { label: 'Justification', description: 'Retained' },
      },
    };
    expect(placementLabel(authored, node)).toBe('Justification');
    expect(nodeLabel(node)).toBe('Justification');
    expect(authored.scope).toBe('/properties/purchase_reason');
  });
  it('humanizes the canonical binding without changing it or showing pointer syntax', () => {
    const node = { ...resolved, label: null };
    expect(placementLabel({ ...authored, label: '' }, node)).toBe(
      'Purchase Reason',
    );
    expect(nodeLabel(node)).toBe('Purchase Reason');
    expect(node.scope).toBe('/properties/purchase_reason');
    expect(placementLabel({ ...authored, label: '' })).toBe('Purchase Reason');
  });
  it('does not invent runtime headings for an unlabeled layout', () => {
    expect(nodeLabel({ label: null, scope: null, display: {} })).toBe('');
    expect(placementLabel({ component: 'vertical' })).toBe('vertical');
  });
});
