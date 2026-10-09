import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { STUDIO_API } from '../../bindings';
import { ResourceCatalog } from './resource-catalog';

describe('Parent catalog lookup lifetime', () => {
  async function pendingLookup(): Promise<{
    fixture: ReturnType<typeof TestBed.createComponent<ResourceCatalog>>;
    resolve: (row: { ref_id: string; name: string }) => void;
  }> {
    let resolve!: (row: { ref_id: string; name: string }) => void;
    const pending = new Promise<{ ref_id: string; name: string }>((finish) => {
      resolve = finish;
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { resourceKey: 'form-versions' },
              queryParamMap: { get: (): string => 'parent-ref' },
            },
          },
        },
        {
          provide: STUDIO_API,
          useValue: {
            spec: (): unknown => ({
              title: 'Form versions',
              fields: [],
              createFields: [],
              queryFields: [{ key: 'form_ref_id' }],
              actions: [],
            }),
            get: (): typeof pending => pending,
            search: async (): Promise<unknown> => ({
              items: [],
              page: 1,
              totalPages: 0,
            }),
          },
        },
      ],
    });
    return { fixture: TestBed.createComponent(ResourceCatalog), resolve };
  }
  it('discards a label after route destruction', async () => {
    const { fixture, resolve } = await pendingLookup();
    fixture.destroy();
    resolve({ ref_id: 'parent-ref', name: 'Private parent' });
    await Promise.resolve();
    expect(fixture.componentInstance.parentLabel()).toBe('');
  });
  it('discards a label after an actor change', async () => {
    const { fixture, resolve } = await pendingLookup();
    TestBed.inject(ActorState).reset();
    resolve({ ref_id: 'parent-ref', name: 'Private parent' });
    await Promise.resolve();
    expect(fixture.componentInstance.parentLabel()).toBe('');
  });
  it('keeps the selected parent when an older label lookup completes', async () => {
    const { fixture, resolve } = await pendingLookup();
    fixture.componentInstance.chooseParent({
      ref_id: 'selected-parent',
      name: 'Selected parent',
    });
    resolve({ ref_id: 'parent-ref', name: 'Old parent' });
    await Promise.resolve();
    expect(fixture.componentInstance.parentLabel()).toBe('Selected parent');
  });
  it('retains a label in the current live view', async () => {
    const { fixture, resolve } = await pendingLookup();
    resolve({ ref_id: 'parent-ref', name: 'Current parent' });
    await Promise.resolve();
    expect(fixture.componentInstance.parentLabel()).toBe('Current parent');
  });
});
