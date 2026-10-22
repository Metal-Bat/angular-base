import { localizedDateTime } from '../../../../shared/ui/localized-datetime-pipe';
import { Locale } from '../../../../core/localization/locale';
import { runtimeFixture } from '../../testing/runtime-fixtures';
import { readRuntimeDocument } from '../../infrastructure/runtime-document-adapter';
import { RuntimeForm } from '../runtime-form/runtime-form';
import { TestBed } from '@angular/core/testing';
import { FormValue } from './form-value';

describe('Field-based read-only values', () => {
  it('localizes typed read-only dates in all three calendars while leaving canonical answers intact', async () => {
    const fixture = TestBed.createComponent(FormValue);
    const locale = TestBed.inject(Locale);
    const value = { day: '2026-10-17', instant: '2026-10-17T20:00:00Z' };
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('kinds', {
      '/properties/day': 'date',
      '/properties/instant': 'datetime',
    });
    for (const language of ['en', 'fa', 'ar'] as const) {
      await locale.set(language);
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toContain(
        locale.date(new Date('2026-10-17T00:00:00Z'), 'UTC'),
      );
      expect(fixture.nativeElement.textContent).toContain(
        localizedDateTime(locale, value.instant),
      );
    }
    expect(value).toEqual({
      day: '2026-10-17',
      instant: '2026-10-17T20:00:00Z',
    });
  });
  it('renders nested named values, zero, false and null without serializing data or changing it', async () => {
    const fixture = TestBed.createComponent(FormValue);
    const value = [{ title: 'First', amount: 0, selected: false, note: null }];
    const original = structuredClone(value);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('scope', '/properties/rows');
    fixture.componentRef.setInput('labels', {
      '/properties/rows/items/properties/title': 'Item title',
    });
    await fixture.whenStable();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Item title');
    expect(text).toContain('First');
    expect(text).toContain('0');
    expect(text).toContain('No');
    expect(text).toContain('Null');
    expect(text).not.toContain('{');
    expect(text).not.toContain('[');
    expect(value).toEqual(original);
  });
  it('keeps resource references internal while preserving the number and order of attached items', async () => {
    const fixture = TestBed.createComponent(FormValue);
    fixture.componentRef.setInput('scope', '/properties/receipts');
    fixture.componentRef.setInput('kinds', {
      '/properties/receipts': 'attachment_collection',
    });
    fixture.componentRef.setInput('value', [
      'private-first-ref',
      'private-second-ref',
    ]);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelectorAll('[role=listitem]'),
    ).toHaveLength(2);
    expect(fixture.nativeElement.textContent).not.toContain('private-');
    expect(fixture.nativeElement.textContent).toContain('Attachment');
  });
  it('localizes system states without translating user-entered values or resolved captions', async () => {
    const fixture = TestBed.createComponent(FormValue);
    fixture.componentRef.setInput('value', { text: 'Name', enabled: false });
    fixture.componentRef.setInput('labels', { '/properties/text': 'Title' });
    await TestBed.inject(Locale).set('fa');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Name');
    expect(fixture.nativeElement.textContent).toContain('Title');
    expect(fixture.nativeElement.textContent).toContain('خیر');
  });
  it('opens prior collection values as resolved fields without JSON, pointers or eager hidden content', async () => {
    const raw = runtimeFixture('REQUEST');
    const scope = '/properties/rows';
    const key = '019b0000-0000-7000-8000-000000000001';
    Object.assign(raw, {
      data: { rows: [{ title: 'Current title' }] },
      before_data: { rows: [{ title: 'Prior title' }] },
      item_identity: { '/rows': [key] },
      before_item_identity: { '/rows': [key] },
      actions: [],
      readable_scopes: [scope, scope + '/items/properties/title'],
      writable_scopes: [],
      required_scopes: [],
      field_metadata: [
        {
          scope,
          validation_schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: { title: { type: 'string' } },
            },
          },
          writable: false,
          required: false,
        },
        {
          scope: scope + '/items/properties/title',
          validation_schema: { type: 'string' },
          writable: false,
          required: false,
        },
      ],
      render_schema: {
        dialect: 'bpms.render/1',
        root: {
          component: 'vertical',
          children: [
            {
              component: 'table',
              scope,
              label: 'Line items',
              children: [
                {
                  component: 'text',
                  scope: scope + '/items/properties/title',
                  label: 'Description',
                },
              ],
            },
          ],
        },
      },
    });
    const parsed = readRuntimeDocument(raw);
    if (parsed.status !== 'ready') {
      throw Error('Invalid owned prior collection fixture');
    }
    const fixture = TestBed.createComponent(RuntimeForm);
    fixture.componentRef.setInput('document', parsed.document);
    fixture.componentRef.setInput('data', parsed.document.canonical);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Prior title');
    const prior = fixture.nativeElement.querySelector(
      'details',
    ) as HTMLDetailsElement;
    prior.open = true;
    prior.dispatchEvent(new Event('toggle'));
    await fixture.whenStable();
    expect(prior.textContent).toContain('Line items');
    expect(prior.textContent).toContain('Description');
    expect(prior.textContent).toContain('Prior title');
    expect(prior.textContent).not.toContain('/properties/');
    expect(prior.textContent).not.toContain('{');
    expect(prior.textContent).not.toContain('[');
  });
});
