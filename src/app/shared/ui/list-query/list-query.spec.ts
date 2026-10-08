import { TestBed } from '@angular/core/testing';
import { emptyQuery, ListQuery } from '../../domain/list-query';
import { ListQueryEditor } from './list-query';

describe('List query form sections', () => {
  it('renders replacement queries and clears the filter section from the parent form', async () => {
    const fixture = TestBed.createComponent(ListQueryEditor);
    fixture.componentRef.setInput('fields', [
      { key: 'name', label: 'Name', type: 'text' },
    ]);
    fixture.componentRef.setInput('query', {
      ...emptyQuery(),
      filters: [{ field_name: 'name', operation: 'equal', value: 'Ada' }],
    });
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    root
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Advanced filters"]',
      )!
      .click();
    await fixture.whenStable();
    const value = (): HTMLInputElement | null =>
      root.querySelector('input[data-query-value="0"]');
    expect(value()?.value).toBe('Ada');

    fixture.componentRef.setInput('query', {
      ...emptyQuery(),
      filters: [{ field_name: 'name', operation: 'equal', value: 'Grace' }],
    });
    await fixture.whenStable();
    expect(value()?.value).toBe('Grace');

    const emitted: ListQuery[] = [];
    fixture.componentInstance.applied.subscribe((query) => emitted.push(query));
    [...root.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Clear')!
      .click();
    await fixture.whenStable();
    expect(value()).toBeNull();
    expect(emitted.at(-1)?.filters).toEqual([]);
  });

  it('shows validation from the parent and submits corrected filter values', async () => {
    const fixture = TestBed.createComponent(ListQueryEditor);
    fixture.componentRef.setInput('fields', [
      { key: 'count', label: 'Count', type: 'number' },
    ]);
    fixture.componentRef.setInput('query', {
      ...emptyQuery(),
      filters: [{ field_name: 'count', operation: 'between', value: [1, 9] }],
    });
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    root
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Advanced filters"]',
      )!
      .click();
    await fixture.whenStable();
    const value = root.querySelector<HTMLInputElement>(
      'input[data-query-value="0"]',
    )!;
    const form = root.querySelector<HTMLFormElement>('form')!;
    const emitted: ListQuery[] = [];
    fixture.componentInstance.applied.subscribe((query) => emitted.push(query));
    value.value = '';
    value.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    expect(emitted).toHaveLength(0);
    expect(root.querySelector('app-query-filters [role="alert"]')).toBeTruthy();
    value.value = '2';
    value.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    expect(emitted.at(-1)?.filters).toEqual([
      { field_name: 'count', operation: 'between', value: [2, 9] },
    ]);
    expect(root.querySelector('app-query-filters [role="alert"]')).toBeNull();
  });
});
