import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RUNTIME_OPTIONS } from '../../bindings';
import { RuntimeOptionsPort } from '../../application/runtime-options-port';
import { readRuntimeDocument } from '../../infrastructure/runtime-document-adapter';
import { runtimeFixture } from '../../testing/runtime-fixtures';
import { RuntimeForm } from './runtime-form';
import { RuntimeDocument } from '../../domain/runtime-document';

async function pagedFields(
  first: string,
  second: string,
  values: Record<string, number>,
): Promise<ComponentFixture<RuntimeForm>> {
  const result = readRuntimeDocument(runtimeFixture());
  if (result.status !== 'ready') {
    throw Error('Invalid owned fixture');
  }
  const scopes = [first, second].map((key) => '/properties/' + key);
  const document: RuntimeDocument = {
    ...result.document,
    canonical: values,
    before: values,
    render: {
      ...result.document.render,
      children: scopes.map((scope, index) => ({
        ...result.document.render.children[0],
        component: 'integer',
        scope,
        label: index ? second : first,
      })),
    },
    fields: scopes.map((scope) => ({
      scope,
      schema: { type: 'integer', minimum: 1 },
      writable: true,
      required: false,
    })),
    policy: { readable: scopes, writable: scopes, required: [] },
    page: {
      pages: scopes.map((scope, index) => ({
        key: String(index),
        title: 'Page ' + index,
        scopes: [scope],
      })),
    },
  };
  const fixture = TestBed.createComponent(RuntimeForm);
  fixture.componentRef.setInput('document', document);
  fixture.componentRef.setInput('data', values);
  await fixture.whenStable();
  return fixture;
}

describe('Paged runtime placement identity', () => {
  it('keeps a raw invalid field on its page even when the last canonical number remains valid', async () => {
    const fixture = await pagedFields('items_total', 'other', {
      items_total: 1,
      other: 1,
    });
    fixture.componentRef.setInput('issues', [
      { pointer: '/items_total', message: 'Enter a valid number' },
    ]);
    await fixture.whenStable();
    fixture.componentInstance.next();
    expect(fixture.componentInstance.page()).toBe(0);
    expect(fixture.componentInstance.pageError()).toBe(
      'Complete the required fields on this page',
    );
  });
  it('blocks invalid items fields and retains their previous value', async () => {
    const fixture = await pagedFields('items_total', 'other', {
      items_total: 0,
      other: 1,
    });
    fixture.componentInstance.next();
    expect(fixture.componentInstance.page()).toBe(0);
    expect(fixture.componentInstance.pageError()).toBe(
      'Complete the required fields on this page',
    );
    expect(
      fixture.componentInstance.previousFields().map((field) => field.scope),
    ).toEqual(['/properties/items_total', '/properties/other']);
  });
  it('does not treat a neighboring field prefix as a field on the current page', async () => {
    const fixture = await pagedFields('amount', 'amount_extra', {
      amount: 1,
      amount_extra: 0,
    });
    fixture.componentInstance.next();
    expect(fixture.componentInstance.page()).toBe(1);
    expect(fixture.componentInstance.pageError()).toBe('');
  });
  it('queries the original option pointer after paging and never changes the source or canonical answers', async () => {
    const query = vi.fn<RuntimeOptionsPort['query']>(
      async (_document, _pointer, input, generation) => ({
        state: 'READY',
        generation,
        fingerprint: 'owned',
        revision: 'source',
        locale: input.locale,
        page: 1,
        totalPages: 1,
        items: [{ key: 'json:1', value: 'Confirmed choice' }],
      }),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: RUNTIME_OPTIONS, useValue: { query } }],
    });
    const raw = runtimeFixture();
    raw['page_settings'] = {
      pages: [
        { key: 'first', title: 'Details', scopes: ['/properties/amount'] },
        { key: 'second', title: 'Review', scopes: ['/properties/choice'] },
      ],
    };
    const result = readRuntimeDocument(raw);
    if (result.status !== 'ready') {
      throw Error('Invalid owned fixture');
    }
    const original = JSON.stringify(result.document);
    const fixture = TestBed.createComponent(RuntimeForm);
    fixture.componentRef.setInput('document', result.document);
    fixture.componentRef.setInput('data', result.document.canonical);
    const edits = vi.fn();
    fixture.componentInstance.edit.subscribe(edits);
    await fixture.whenStable();
    expect(query).not.toHaveBeenCalled();
    fixture.componentInstance.next();
    await fixture.whenStable();
    await vi.waitFor(() => expect(query).toHaveBeenCalled());
    expect(query.mock.lastCall?.[1]).toBe('/root/children/3');
    expect(
      fixture.nativeElement.querySelector('app-choice-control'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input.p-inputtext')).toBeNull();
    expect(JSON.stringify(result.document)).toBe(original);
    expect(edits).not.toHaveBeenCalled();
    fixture.componentInstance.page.set(0);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('app-choice-control'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('input.p-inputtext'),
    ).not.toBeNull();
    expect(JSON.stringify(result.document)).toBe(original);
  });
});

describe('Linked correction navigation', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
      {},
    ] as unknown as DOMRectList);
  });
  afterEach(() => vi.restoreAllMocks());
  it('focuses the requested page and preserves unsaved values without emitting edits', async () => {
    const fixture = await pagedFields('first', 'second', {
      first: 42,
      second: 99,
    });
    const form = fixture.componentInstance;
    const edits = vi.fn();
    form.edit.subscribe(edits);
    form.focusField('/properties/second', '/second');
    await fixture.whenStable();
    expect(form.page()).toBe(1);
    expect(document.activeElement?.id).toBe('field-%2Fsecond');
    expect((document.activeElement as HTMLInputElement).value).toBe('99');
    form.focusField('/properties/first', '/first');
    await fixture.whenStable();
    expect(form.page()).toBe(0);
    expect(document.activeElement?.id).toBe('field-%2Ffirst');
    expect(form.data()).toEqual({ first: 42, second: 99 });
    expect(edits).not.toHaveBeenCalled();
  });
  it('keeps invalid raw input on its page instead of destroying the control', async () => {
    const fixture = await pagedFields('first', 'second', {
      first: 1,
      second: 1,
    });
    fixture.componentRef.setInput('issues', [
      { pointer: '/first', message: 'Enter a valid number' },
    ]);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    input.value = 'invalid';
    fixture.componentInstance.focusField('/properties/second', '/second');
    await fixture.whenStable();
    expect(fixture.componentInstance.page()).toBe(0);
    expect(input.value).toBe('invalid');
    expect(document.activeElement).toBe(input);
    expect(fixture.componentInstance.pageError()).toBe(
      'Correct the invalid values on this page before leaving.',
    );
  });
  it('rejects unrelated paths and does not focus after an authoritative resource change', async () => {
    const fixture = await pagedFields('first', 'second', {
      first: 1,
      second: 1,
    });
    const form = fixture.componentInstance;
    form.focusField('/properties/second', '/first');
    await fixture.whenStable();
    expect(form.page()).toBe(0);
    expect(form.navigationError()).toBe('Field unavailable');
    form.focusField('/properties/second', '/second');
    const current = form.document();
    fixture.componentRef.setInput('document', {
      ...current,
      identity: { ...current.identity, resource: 'different-owner' },
    });
    await fixture.whenStable();
    expect(form.navigationError()).toBe('Field unavailable');
    expect(document.activeElement?.id).not.toBe('field-%2Fsecond');
  });
});
