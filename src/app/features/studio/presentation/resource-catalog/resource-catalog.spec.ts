import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { FieldSpec } from '../../domain/authoring';
import { STUDIO_API } from '../../bindings';
import { ResourceCatalog } from './resource-catalog';
const name: FieldSpec = {
  key: 'name',
  title: 'Name',
  type: 'text',
  required: true,
  nullable: false,
  options: [],
  initial: undefined,
  schema: {},
};
const targets: FieldSpec = {
  ...name,
  key: 'client_targets',
  title: 'Client targets',
  type: 'json',
  required: false,
};
describe('Definition command protection', () => {
  const write = vi.fn();
  const get = vi.fn();
  beforeEach(() => {
    write.mockReset();
    get.mockResolvedValue({
      ref_id: 'current',
      name: 'Original',
      client_targets: [{ client_ref_id: 'protected-client' }],
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { resourceKey: 'request-types' },
              queryParamMap: { get: (): null => null },
            },
          },
        },
        {
          provide: STUDIO_API,
          useValue: {
            spec: (): unknown => ({
              key: 'request-types',
              title: 'Request types',
              fields: [name, targets],
              createFields: [name, targets],
              queryFields: [],
              actions: ['update'],
            }),
            search: async (): Promise<unknown> => ({
              items: [],
              page: 1,
              totalPages: 0,
            }),
            get,
            write,
          },
        },
      ],
    });
  });
  it('preserves restrictions on rename and blocks invalid JSON even after another edit', async () => {
    const fixture = TestBed.createComponent(ResourceCatalog);
    const editor = fixture.componentInstance;
    await fixture.whenStable();
    await editor.open('current');
    editor.change(targets, '{invalid');
    editor.change(name, 'Renamed');
    await editor.save();
    expect(editor.canSave()).toBe(false);
    expect(write).not.toHaveBeenCalled();
    expect(editor.values()['client_targets']).toEqual([
      { client_ref_id: 'protected-client' },
    ]);
  });
  it('requires explicit confirmation to clear existing client restrictions', async () => {
    const fixture = TestBed.createComponent(ResourceCatalog);
    const editor = fixture.componentInstance;
    await fixture.whenStable();
    await editor.open('current');
    editor.change(targets, '[]');
    const saving = editor.save();
    expect(TestBed.inject(Feedback).confirmation()).not.toBeNull();
    TestBed.inject(Feedback).answer(false);
    await saving;
    expect(write).not.toHaveBeenCalled();
  });
  it('clears one-time client secrets and selected data on actor reset', async () => {
    get.mockResolvedValue({
      client: { ref_id: 'client', name: 'Client' },
      secret: 'only-once',
    });
    const fixture = TestBed.createComponent(ResourceCatalog);
    await fixture.whenStable();
    const editor = fixture.componentInstance;
    await editor.open('client');
    expect(editor.secret()).toBe('only-once');
    TestBed.inject(ActorState).reset();
    expect(editor.secret()).toBe('');
    expect(editor.selected()).toBeNull();
    expect(editor.values()).toEqual({});
  });
});
