import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../core/auth/actor-state';
import { STUDIO_API } from '../bindings';
import { CatalogRelations } from './catalog-relations';

it('discards old related-resource names after an actor change', async () => {
  let finish!: (value: unknown[]) => void;
  const auxiliary = vi.fn((kind: string) => {
    expect(kind).toBe('selected');
    return new Promise<unknown[]>((resolve) => {
      finish = resolve;
    });
  });
  TestBed.configureTestingModule({
    providers: [{ provide: STUDIO_API, useValue: { auxiliary } }],
  });
  const fixture = TestBed.createComponent(CatalogRelations);
  fixture.componentRef.setInput('record', { form_ref_id: 'private-form' });
  await fixture.whenStable();
  expect(auxiliary.mock.calls[0][0]).toBe('selected');
  TestBed.inject(ActorState).reset();
  finish([
    {
      kind: 'forms',
      available: true,
      ref_id: 'private-form',
      label: 'Previous actor private name',
    },
  ]);
  await fixture.whenStable();
  expect(fixture.componentInstance.labels()).toEqual([]);
  expect(fixture.nativeElement.textContent).not.toContain(
    'Previous actor private name',
  );
  fixture.destroy();
});
