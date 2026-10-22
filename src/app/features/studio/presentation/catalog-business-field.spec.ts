import { TestBed } from '@angular/core/testing';
import { STUDIO_API } from '../bindings';
import { FieldSpec } from '../domain/authoring';
import { JsonValue } from '../../forms/domain/runtime-document';
import { CatalogBusinessField } from './catalog-business-field';

it('preserves untouched client restrictions and emits explicit empty restrictions only after removal', async () => {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: STUDIO_API,
        useValue: { auxiliary: vi.fn().mockResolvedValue([]) },
      },
    ],
  });
  const fixture = TestBed.createComponent(CatalogBusinessField);
  const field: FieldSpec = {
    key: 'client_targets',
    title: 'Clients',
    type: 'json',
    required: false,
    nullable: false,
    options: [],
    initial: undefined,
    schema: { type: 'array' },
  };
  fixture.componentRef.setInput('field', field);
  fixture.componentRef.setInput('values', {
    client_targets: [
      {
        client_ref_id: 'saved-client',
        minimum_release: '1.0.0',
        maximum_release_exclusive: '3.0.0',
      },
    ],
  });
  const changes: (JsonValue | undefined)[] = [];
  fixture.componentInstance.changed.subscribe((value) => changes.push(value));
  await fixture.whenStable();
  expect(changes).toEqual([]);
  fixture.componentInstance.changeTarget(0, 'minimum_release', '');
  expect(changes.at(-1)).toEqual([
    {
      client_ref_id: 'saved-client',
      minimum_release: null,
      maximum_release_exclusive: '3.0.0',
    },
  ]);
  fixture.componentInstance.removeTarget(0);
  expect(changes.at(-1)).toEqual([]);
  expect(fixture.componentInstance.targets()[0]['client_ref_id']).toBe(
    'saved-client',
  );
  fixture.destroy();
});
