import { TestBed } from '@angular/core/testing';
import { SavedViewRepair } from './saved-view-repair';
it('shows canonical compound ordering, columns and page size before replacing incompatible intent', async () => {
  const fixture = TestBed.createComponent(SavedViewRepair);
  fixture.componentRef.setInput('original', {
    ref_id: 'owned',
    name: 'Original',
    resource_kind: 'business_requests',
    schema_version: 0,
    compatible: false,
    reason: 'schema_changed',
    is_default: false,
    page_size: 35,
    column_keys: ['status', 'priority'],
    query: {
      scope: 'mine',
      filters: [
        {
          field_name: 'removed_field',
          operation: 'equal',
          value: { private: 'retained' },
        },
      ],
      sort_orders: [
        { multi_field: ['priority', 'created_at'], operation: 'desc' },
      ],
    },
  });
  fixture.componentRef.setInput('replacement', {
    scope: 'mine',
    size: 20,
    filters: [],
    sort_orders: [],
  });
  fixture.componentRef.setInput('replacementColumns', ['created_at']);
  await fixture.whenStable();
  const [original, replacement] = fixture.componentInstance.sections();
  expect(original.sorts).toEqual([
    { field: 'priority, created_at', direction: 'desc' },
  ]);
  expect(original.pageSize).toBe('35');
  expect(original.columns).toEqual(['Status', 'Priority']);
  expect(original.filters[0].value).toBe('Structured constraint retained.');
  expect(replacement.pageSize).toBe('20');
  expect(replacement.columns).toEqual(['Created At']);
});
