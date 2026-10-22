import { ChoiceControl } from '../choice-control/choice-control';
import { By } from '@angular/platform-browser';
import { TemporalControl } from '../../../../shared/ui/temporal-control/temporal-control';
import { TestBed } from '@angular/core/testing';
import { FORM_RESOURCES, RUNTIME_OPTIONS } from '../../bindings';
import {
  deferredPrimitives,
  implementedPrimitives,
} from '../../domain/primitive-registry';
import { readRuntimeDocument } from '../../infrastructure/runtime-document-adapter';
import { runtimeFixture } from '../../testing/runtime-fixtures';
import { RuntimeForm } from './runtime-form';
import { RuntimeDocument } from '../../domain/runtime-document';
import { OptionInput, OptionPage } from '../../domain/option-coordinator';
import { RuntimeField } from '../runtime-node/runtime-field';
import { MISSING } from '../../domain/canonical-values';
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
  it('retains precision-losing runtime numeric text and preserves the prior canonical value', () => {
    const { fixture, document } = render(runtimeFixture());
    const edited = vi.fn();
    fixture.componentInstance.edit.subscribe(edited);
    const control = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLInputElement>(
      '#field-' + CSS.escape(encodeURIComponent('/amount')),
    )!;
    for (const text of [
      '9007199254740993',
      '0.10000000000000000001',
      '1e-324',
    ]) {
      control.value = text;
      control.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(control.value).toBe(text);
      expect(edited.mock.lastCall?.[0]).toMatchObject({
        scope: '/properties/amount',
        value: 125,
        error: 'Enter a valid number',
      });
    }
    control.value = '۱۲٫۵';
    control.dispatchEvent(new Event('input'));
    expect(edited.mock.lastCall?.[0]).toMatchObject({
      scope: '/properties/amount',
      value: 12.5,
      error: undefined,
    });
    expect(document.canonical['amount']).toBe(125);
  });
  it('uses readable unresolved choice values and keeps ordinary search collapsed', async () => {
    const { fixture } = render(runtimeFixture());
    await fixture.whenStable();
    const choice = fixture.debugElement.query(By.directive(ChoiceControl))
      .componentInstance as ChoiceControl;
    expect(choice.missingLabel('json:false')).toBe('No');
    expect(choice.missingLabel('json:0')).toBe('0');
    expect(choice.missingLabel('json:"Readable"')).toBe('Readable');
    expect(
      fixture.nativeElement.querySelector(
        'app-choice-control input[type=search]',
      ),
    ).toBeNull();
    choice.searchOpen.set(true);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector(
        'app-choice-control input[type=search]',
      ),
    ).toBeTruthy();
  });

  it('shows resolved help and placeholder without changing canonical values', () => {
    const input = runtimeFixture();
    input['render_schema'] = {
      dialect: 'bpms.render/1',
      root: {
        component: 'vertical',
        children: [
          {
            component: 'integer',
            scope: '/properties/amount',
            label: 'Amount',
            options: { placeholder: 'Whole units' },
            localized_text: { help: 'Enter the number of units.' },
            accessibility: { description: 'Use whole numbers.' },
          },
        ],
      },
    };
    const { fixture, document } = render(input);
    const control = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    expect(control.placeholder).toBe('Whole units');
    expect(control.getAttribute('inputmode')).toBe('numeric');
    expect(control.getAttribute('aria-required')).toBe('true');
    expect(
      fixture.nativeElement
        .querySelector('label [aria-hidden="true"]')
        ?.textContent?.trim(),
    ).toBe('*');
    expect(fixture.nativeElement.textContent).toContain(
      'Enter the number of units.',
    );
    expect(fixture.nativeElement.textContent).toContain('Use whole numbers.');
    expect(control.getAttribute('aria-describedby')).toContain('hint');
    expect(document.canonical).toEqual(input['data']);
  });
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
    for (const control of controls) {
      expect(
        [...element.querySelectorAll('label')].some(
          (label) => label.htmlFor === control.id,
        ),
      ).toBe(true);
    }
    expect(document.canonical).toEqual(input['data']);
  });
  it('separates attachment placement IDs while uploading to the canonical field path', async () => {
    const upload = vi.fn(async () => undefined);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: FORM_RESOURCES,
          useValue: {
            ownerKey: (): string => 'case-owner',
            attachments: async (): Promise<readonly never[]> => [],
            upload,
            transferBusy: (): boolean => false,
            pendingAttachment: (): null => null,
            progress: (): null => null,
          },
        },
      ],
    });
    const input = runtimeFixture();
    input['render_schema'] = {
      dialect: 'bpms.render/1',
      root: {
        component: 'vertical',
        children: ['original', 'copy'].map((key) => ({
          component: 'attachment_collection',
          scope: '/properties/amount',
          node_key: key,
          accessibility: { label: 'Supporting documents' },
        })),
      },
    };
    const { fixture, document } = render(input);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const controls = [...element.querySelectorAll<HTMLInputElement>('input')];
    expect(controls).toHaveLength(4);
    expect(new Set(controls.map((control) => control.id)).size).toBe(4);
    for (const control of controls) {
      expect(
        [...element.querySelectorAll('label')].some(
          (label) => label.htmlFor === control.id,
        ),
      ).toBe(true);
    }
    const file = new File(['receipt'], 'receipt.txt', { type: 'text/plain' });
    const files =
      element.querySelectorAll<HTMLInputElement>('input[type=file]');
    for (const control of files) {
      await vi.waitFor(() => expect(control.disabled).toBe(false));
      Object.defineProperty(control, 'files', { value: [file] });
      control.dispatchEvent(new Event('change'));
      await fixture.whenStable();
    }
    expect(upload).toHaveBeenCalledTimes(2);
    expect(upload.mock.calls).toEqual([
      ['/amount', file, false, '', expect.any(AbortSignal)],
      ['/amount', file, false, '', expect.any(AbortSignal)],
    ]);
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
  it('offers distinct null and omission intents only on eligible fields and preserves false', () => {
    const { fixture } = render(runtimeFixture());
    const fields = fixture.debugElement
      .queryAll(By.directive(RuntimeField))
      .map((element) => element.componentInstance as RuntimeField);
    const amount = fields.find(
      (field) => field.view().node().scope === '/properties/amount',
    )!;
    const decimal = fields.find(
      (field) => field.view().node().scope === '/properties/decimal',
    )!;
    const approved = fields.find(
      (field) => field.view().node().scope === '/properties/approved',
    )!;
    expect(amount.actions()).toEqual([]);
    const edits: FieldEdit[] = [];
    fixture.componentInstance.edit.subscribe((change) => edits.push(change));
    decimal.actions().find((action) => action.label === 'Set null')!.command!(
      {},
    );
    expect(edits.at(-1)?.value).toBeNull();
    decimal.actions().find((action) => action.label === 'Remove value')!
      .command!({});
    expect(edits.at(-1)?.value).toBe(MISSING);
    expect(approved.view().value()).toBe(false);
    fixture.componentRef.setInput('busy', true);
    fixture.detectChanges();
    expect(fields.every((field) => field.actions().length === 0)).toBe(true);
  });
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
