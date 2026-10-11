import { By } from '@angular/platform-browser';
import { TemporalControl } from '../../../../shared/ui/temporal-control/temporal-control';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_OPTIONS } from '../../bindings';
import {
  deferredPrimitives,
  implementedPrimitives,
} from '../../domain/primitive-registry';
import { readRuntimeDocument } from '../../infrastructure/runtime-document-adapter';
import { runtimeFixture } from '../../testing/runtime-fixtures';
import { RuntimeForm } from './runtime-form';
import { RuntimeDocument } from '../../domain/runtime-document';
import { OptionInput, OptionPage } from '../../domain/option-coordinator';
import { FieldEdit } from '../../domain/canonical-values';
function render(input: Record<string, unknown>): {
  document: RuntimeDocument;
  fixture: ReturnType<typeof TestBed.createComponent<RuntimeForm>>;
} {
  const result = readRuntimeDocument(input);
  if (result.status !== 'ready') {
    throw new Error('Invalid renderer fixture');
  }
  const fixture = TestBed.createComponent(RuntimeForm);
  fixture.componentRef.setInput('document', result.document);
  fixture.componentRef.setInput('data', result.document.canonical);
  fixture.detectChanges();
  return { document: result.document, fixture };
}
describe('Primitive presentation matrix', () => {
  it('renders the backend grid column option without changing canonical values', () => {
    const input = runtimeFixture();
    input['render_schema'] = {
      dialect: 'bpms.render/1',
      root: { component: 'grid', options: { columns: 3 }, children: [] },
    };
    const { document, fixture } = render(input);
    const layout = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLElement>('.runtime-layout');
    expect(layout?.style.getPropertyValue('--form-layout-columns')).toBe('3');
    expect(document.canonical).toEqual(input['data']);
  });
  it('gives shared field placements distinct accessible IDs and a canonical focus target', () => {
    const input = runtimeFixture();
    input['render_schema'] = {
      dialect: 'bpms.render/1',
      root: {
        component: 'vertical',
        children: [
          {
            component: 'integer',
            scope: '/properties/amount',
            node_key: 'original',
            label: 'Amount',
          },
          {
            component: 'integer',
            scope: '/properties/amount',
            node_key: 'copy',
            label: 'Repeated amount',
          },
        ],
      },
    };
    const { document, fixture } = render(input);
    const element = fixture.nativeElement as HTMLElement;
    const controls = [...element.querySelectorAll<HTMLInputElement>('input')];
    expect(controls).toHaveLength(2);
    expect(new Set(controls.map((control) => control.id)).size).toBe(2);
    expect(controls[0].id).toBe('field-' + encodeURIComponent('/amount'));
    expect(controls[1].id).toContain('--copy');
    expect(
      [...element.querySelectorAll('label')].map((label) => label.htmlFor),
    ).toEqual(controls.map((control) => control.id));
    expect(document.canonical).toEqual(input['data']);
  });
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        {
          provide: RUNTIME_OPTIONS,
          useValue: {
            query: async (
              _document: RuntimeDocument,
              _pointer: string,
              input: OptionInput,
              generation: number,
            ): Promise<OptionPage> => ({
              state: 'READY',
              generation,
              fingerprint: 'fixture',
              revision: 'pinned',
              locale: input.locale,
              page: 1,
              totalPages: 1,
              items: [{ key: 'json:1', value: 'One' }],
            }),
          },
        },
      ],
    }),
  );
  it.each(implementedPrimitives)(
    'renders the supported %s primitive without manufacturing commands or values',
    (kind) => {
      const input = runtimeFixture();
      if (kind === 'date' || kind === 'datetime') {
        (input['data'] as Record<string, unknown>)['decimal'] =
          kind === 'date' ? '2024-03-20' : '2024-03-20T08:00:00Z';
      }
      input['render_schema'] = {
        dialect: 'bpms.render/1',
        root: ['vertical', 'horizontal', 'grid'].includes(kind)
          ? {
              component: kind,
              label: 'Layout',
              children: [
                {
                  component: 'text',
                  scope: '/properties/decimal',
                  label: 'Exact decimal',
                },
              ],
            }
          : {
              component: kind,
              scope:
                kind === 'action' || kind === 'display'
                  ? null
                  : '/properties/decimal',
              label: 'Fixture field',
            },
      };
      const { fixture, document } = render(input);
      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
      if (kind === 'action') {
        expect(fixture.nativeElement.querySelector('button')).toBeNull();
      } else {
        expect(fixture.nativeElement.textContent).toContain(
          ['vertical', 'horizontal', 'grid'].includes(kind)
            ? 'Exact decimal'
            : 'Fixture field',
        );
      }
      expect(fixture.componentInstance.data()).toEqual(document.canonical);
    },
  );
  it.each(deferredPrimitives)(
    'shows explicit compatibility for the deferred %s primitive',
    (kind) => {
      const input = runtimeFixture();
      input['render_schema'] = {
        dialect: 'bpms.render/1',
        root: { component: kind, scope: '/properties/amount' },
      };
      const { fixture } = render(input);
      expect(
        fixture.nativeElement.querySelector('[role="alert"]').textContent,
      ).toContain('unsupported');
      expect(fixture.nativeElement.querySelector('input')).toBeNull();
    },
  );
  it('keeps read-only fields immutable and emits safe typed edits with pointer-linked labels/errors', () => {
    const input = runtimeFixture();
    const { fixture } = render(input);
    const edits: FieldEdit[] = [];
    fixture.componentInstance.edit.subscribe((change) => edits.push(change));
    const control = fixture.nativeElement.querySelector(
      'input[id="field-%2Famount"]',
    ) as HTMLInputElement;
    expect(control.labels?.[0]?.textContent).toContain('Amount');
    control.value = '12.5';
    control.dispatchEvent(new Event('input'));
    expect(edits[0]).toEqual({
      scope: '/properties/amount',
      value: 12.5,
      error: undefined,
    });
    fixture.componentRef.setInput('busy', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
  });
});

describe('Temporal draft validation', () => {
  it('emits a blocking client error for an invalid date even when legacy schema has no format', async () => {
    const input = runtimeFixture();
    (input['data'] as Record<string, unknown>)['decimal'] = '2024-03-20';
    input['render_schema'] = {
      dialect: 'bpms.render/1',
      root: { component: 'date', scope: '/properties/decimal', label: 'Date' },
    };
    const { fixture } = render(input);
    const edits: FieldEdit[] = [];
    fixture.componentInstance.edit.subscribe((edit) => edits.push(edit));
    const picker = fixture.debugElement.query(By.directive(TemporalControl))
      .componentInstance as TemporalControl;
    picker.typeDate('2024-02-30');
    await fixture.whenStable();
    expect(edits.at(-1)?.error).toBe('Enter a valid date or time.');
    expect(edits.at(-1)?.value).toBe('2024-03-20');
    expect(picker.dateText()).toBe('2024-02-30');
    picker.typeDate('2024-02-29');
    await fixture.whenStable();
    expect(edits.at(-1)?.error).toBeUndefined();
    expect(edits.at(-1)?.value).toBe('2024-02-29');
    fixture.destroy();
  });
});
