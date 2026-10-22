import { TestBed } from '@angular/core/testing';
import { readRuntimeDocument } from '../../../forms/infrastructure/runtime-document-adapter';
import { runtimeFixture } from '../../../forms/testing/runtime-fixtures';
import { RuntimeDocument } from '../../../forms/domain/runtime-document';
import { TaskFeedback } from './task-feedback';
const scope = '/properties/lines/items/properties/note';
function source(): RuntimeDocument {
  const parsed = readRuntimeDocument(runtimeFixture());
  if (parsed.status !== 'ready') {
    throw Error('Invalid owned fixture');
  }
  const field = {
    ...parsed.document.render.children[0],
    component: 'text' as const,
    scope,
    label: 'Note',
  };
  return {
    ...parsed.document,
    page: {},
    fields: [
      { scope, schema: { type: 'string' }, writable: false, required: false },
    ],
    policy: { readable: [scope], writable: [], required: [] },
    rowIdentity: { '/lines': ['row-a', 'row-b'] },
    render: { ...parsed.document.render, children: [field] },
  };
}
it('shows current row numbers and navigates without resolving even for read-only feedback', async () => {
  const fixture = TestBed.createComponent(TaskFeedback);
  const document = source();
  fixture.componentRef.setInput('document', document);
  fixture.componentRef.setInput('expanded', true);
  fixture.componentRef.setInput('labels', { [scope]: 'Note' });
  fixture.componentRef.setInput('feedback', [
    {
      key: 'feedback-a',
      scope,
      item: 'row-a',
      message: 'Correct this note',
      status: 'OPEN',
      current: 'Current',
      prior: 'Prior',
    },
  ]);
  const navigate = vi.fn();
  const resolve = vi.fn();
  fixture.componentInstance.fieldRequested.subscribe(navigate);
  fixture.componentInstance.resolved.subscribe(resolve);
  await fixture.whenStable();
  const row = (): HTMLLIElement => fixture.nativeElement.querySelector('li');
  expect(row().textContent).toContain('Row 1');
  expect(row().textContent).toContain('Needs correction');
  expect(row().getAttribute('data-feedback-status')).toBe('OPEN');
  const go = (): HTMLButtonElement => row().querySelector('button')!;
  expect(go().textContent).toContain('Go to field');
  go().click();
  expect(navigate).toHaveBeenCalledWith(
    expect.objectContaining({ scope, item: 'row-a' }),
  );
  expect(resolve).not.toHaveBeenCalled();
  fixture.componentRef.setInput('document', {
    ...document,
    rowIdentity: { '/lines': ['row-b', 'row-a'] },
  });
  await fixture.whenStable();
  expect(row().textContent).toContain('Row 2');
  fixture.componentInstance.locale.numbering.set('arabext');
  await fixture.whenStable();
  expect(row().textContent).toContain('Row ۲');
  fixture.componentRef.setInput('disabled', true);
  await fixture.whenStable();
  expect(go().disabled).toBe(true);
  fixture.componentRef.setInput('document', {
    ...document,
    rowIdentity: { '/lines': ['row-b'] },
  });
  await fixture.whenStable();
  expect(row().textContent).toContain('Field unavailable');
  expect(row().querySelector('button')).toBeNull();
});
it('withholds navigation for hidden ancestors, denied scopes and fields omitted from all pages', async () => {
  const document = source();
  for (const hidden of [
    { ...document, policy: { readable: [], writable: [], required: [] } },
    {
      ...document,
      render: {
        ...document.render,
        display: { runtime_state: { visible: false } },
      },
    },
    {
      ...document,
      page: { pages: [{ key: 'other', title: 'Other', scopes: [] }] },
    },
  ]) {
    const fixture = TestBed.createComponent(TaskFeedback);
    fixture.componentRef.setInput('document', hidden);
    fixture.componentRef.setInput('expanded', true);
    fixture.componentRef.setInput('feedback', [
      {
        key: 'feedback-a',
        scope,
        item: 'row-a',
        message: 'Correct this note',
        status: 'OPEN',
        current: 'Current',
        prior: 'Prior',
      },
    ]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('li button')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Field unavailable');
    fixture.destroy();
  }
});
