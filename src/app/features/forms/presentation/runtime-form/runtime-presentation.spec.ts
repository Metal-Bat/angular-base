import { TestBed } from '@angular/core/testing';
import { FORM_RESOURCES } from '../../bindings';
import { readRuntimeDocument } from '../../infrastructure/runtime-document-adapter';
import { runtimeFixture } from '../../testing/runtime-fixtures';
import { RuntimeForm } from './runtime-form';

describe('Configured runtime presentation', () => {
  it('renders configured multiline rows and placeholder without changing the answer', async () => {
    const raw = runtimeFixture();
    raw['render_schema'] = {
      dialect: 'bpms.render/1',
      root: {
        component: 'textarea',
        scope: '/properties/decimal',
        label: 'Notes',
        options: { rows: 8, placeholder: 'Explain your decision' },
      },
    };
    const parsed = readRuntimeDocument(raw);
    if (parsed.status !== 'ready') {
      throw Error('Invalid fixture');
    }
    const fixture = TestBed.createComponent(RuntimeForm);
    fixture.componentRef.setInput('document', parsed.document);
    fixture.componentRef.setInput('data', parsed.document.canonical);
    await fixture.whenStable();
    const control = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    expect(control.rows).toBe(8);
    expect(control.placeholder).toBe('Explain your decision');
    expect(control.value).toBe('12345678901234567890.123456789');
    expect(parsed.document.canonical['decimal']).toBe(control.value);
  });

  it('renders table headers and rows while edits retain the original row identity', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: FORM_RESOURCES, useValue: { collection: vi.fn() } },
      ],
    });
    const raw = runtimeFixture();
    const scope = '/properties/rows';
    raw['data'] = { rows: [{ title: 'First' }, { title: 'Second' }] };
    raw['item_identity'] = { '/rows': ['row-a', 'row-b'] };
    raw['actions'] = [];
    raw['readable_scopes'] = [scope];
    raw['writable_scopes'] = [scope];
    raw['required_scopes'] = [];
    raw['field_metadata'] = [
      {
        scope,
        writable: true,
        required: false,
        validation_schema: {
          type: 'array',
          items: { type: 'object', properties: { title: { type: 'string' } } },
        },
      },
    ];
    raw['render_schema'] = {
      dialect: 'bpms.render/1',
      root: {
        component: 'table',
        scope,
        node_key: 'line-items',
        label: 'Line items',
        children: [
          {
            component: 'text',
            node_key: 'line-title',
            label: 'Title',
            scope: scope + '/items/properties/title',
          },
        ],
      },
    };
    const parsed = readRuntimeDocument(raw);
    if (parsed.status !== 'ready') {
      throw Error('Invalid fixture');
    }
    const fixture = TestBed.createComponent(RuntimeForm);
    fixture.componentRef.setInput('document', parsed.document);
    fixture.componentRef.setInput('data', parsed.document.canonical);
    const edit = vi.fn();
    fixture.componentInstance.edit.subscribe(edit);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('table thead')?.textContent,
    ).toContain('Title');
    expect(
      fixture.nativeElement.querySelectorAll('table tbody tr'),
    ).toHaveLength(2);
    const second = fixture.nativeElement.querySelectorAll(
      'table tbody input',
    )[1] as HTMLInputElement;
    expect(second.value).toBe('Second');
    second.value = 'Changed';
    second.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(edit).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 'Changed',
        indices: [1],
        rowKeys: ['row-b'],
      }),
    );
    expect(parsed.document.canonical['rows']).toEqual([
      { title: 'First' },
      { title: 'Second' },
    ]);
  });
});
