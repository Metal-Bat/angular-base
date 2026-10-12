import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
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
describe('Blank form creation', () => {
  const search = vi.fn(async () => ({ items: [], page: 1, totalPages: 0 }));
  const get = vi.fn(async () => ({ ref_id: 'form-current', name: 'My form' }));
  const write = vi.fn();
  const action = vi.fn();
  const history = vi.fn();
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: {} },
        { provide: STUDIO_API, useValue: {} },
      ],
    });
  });
  it('creates a scoped blank form draft without asking for schema JSON', async () => {
    const parent = { ...name, key: 'form_ref_id', title: 'Form' };
    const number = {
      ...name,
      key: 'number',
      title: 'Number',
      type: 'number',
      schema: { minimum: 1 },
    } as FieldSpec;
    const schema = {
      ...name,
      key: 'data_schema',
      title: 'Data schema',
      type: 'json',
      schema: { type: 'object' },
    } as FieldSpec;
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        queryParamMap: of(
          convertToParamMap({ parent: 'form-current', create: '1' }),
        ),
        snapshot: {
          data: { resourceKey: 'form-versions' },
          queryParamMap: convertToParamMap({
            parent: 'form-current',
            create: '1',
          }),
        },
      },
    });
    TestBed.overrideProvider(STUDIO_API, {
      useValue: {
        spec: () => ({
          title: 'Form versions',
          createFields: [
            parent,
            number,
            schema,
            { ...schema, key: 'render_schema' },
          ],
          fields: [],
          queryFields: [parent],
          actions: ['create'],
          editor: 'form',
        }),
        search,
        get,
        write,
        action,
        history,
      },
    });
    write.mockResolvedValueOnce({
      ref_id: 'draft-created',
      number: 1,
      status: 'DRAFT',
    });
    const fixture = TestBed.createComponent(ResourceCatalog);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    expect(vm.formOpen()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('textarea#author-data_schema'),
    ).toBeNull();
    expect(vm.values()['form_ref_id']).toBe('form-current');
    await vm.save();
    expect(write).toHaveBeenCalledWith('form-versions', null, {
      form_ref_id: 'form-current',
      number: 1,
      data_schema: { type: 'object', properties: {} },
      render_schema: {
        dialect: 'bpms.render/1',
        root: { component: 'vertical', children: [] },
      },
    });
    expect(vm.reference()).toBe('draft-created');
    expect(vm.formOpen()).toBe(false);
  });
});
