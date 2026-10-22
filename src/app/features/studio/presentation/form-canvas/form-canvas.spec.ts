import { TestBed } from '@angular/core/testing';
import { FormCanvas } from './form-canvas';
describe('Visual form cards', () => {
  it('keeps authored choices alongside resolved labels and help', async () => {
    const fixture = TestBed.createComponent(FormCanvas);
    const documents = {
      data_schema: {
        type: 'object',
        properties: { answer: { type: 'number' } },
      },
      render_schema: {
        root: {
          component: 'vertical',
          children: [
            {
              component: 'choice',
              node_key: 'answer',
              scope: '/properties/answer',
              label: 'Decision',
              source: { kind: 'custom', items: [{ key: 0, value: 'Zero' }] },
            },
          ],
        },
      },
    };
    const before = JSON.stringify(documents);
    fixture.componentRef.setInput('documents', documents);
    fixture.componentRef.setInput('selected', []);
    fixture.componentRef.setInput('resolvedRender', {
      component: 'vertical',
      key: null,
      label: null,
      scope: null,
      renderer: 'default',
      display: {},
      children: [
        {
          component: 'choice',
          key: 'answer',
          scope: '/properties/answer',
          label: 'تصمیم',
          renderer: 'default',
          children: [],
          display: {
            localized_text: { help: 'راهنمای انتخاب' },
            localized_options: [{ value: 0, label: 'صفر' }],
          },
        },
      ],
    });
    await fixture.whenStable();
    const card: HTMLElement =
      fixture.nativeElement.querySelector('.field-card');
    expect(card.querySelector('strong')?.textContent?.trim()).toBe('تصمیم');
    expect(card.querySelector('.card-help')?.textContent).toContain(
      'راهنمای انتخاب',
    );
    expect(card.querySelector('.choice-labels')?.textContent).toContain('صفر');
    expect(
      card.querySelectorAll('input, select, textarea, button, a'),
    ).toHaveLength(0);
    expect(JSON.stringify(documents)).toBe(before);
  });
  it('renders nested grid children with the runtime column and placement rules without changing bindings', async () => {
    const fixture = TestBed.createComponent(FormCanvas);
    const documents = {
      data_schema: { type: 'object', properties: { name: { type: 'string' } } },
      render_schema: {
        root: {
          component: 'vertical',
          children: [
            {
              component: 'grid',
              node_key: 'grid',
              label: 'Contact',
              options: { columns: 3 },
              children: [
                {
                  component: 'text',
                  node_key: 'name',
                  label: 'Name',
                  scope: '/properties/name',
                  grid: { column: 2, span: 2, row: 1 },
                },
              ],
            },
          ],
        },
      },
    };
    const original = JSON.stringify(documents);
    fixture.componentRef.setInput('documents', documents);
    fixture.componentRef.setInput('selected', []);
    const select = vi.fn();
    fixture.componentInstance.selectedChange.subscribe(select);
    await fixture.whenStable();
    const nested = fixture.nativeElement.querySelector(
      '.placement-group > .layout-children',
    ) as HTMLElement;
    expect(nested.style.getPropertyValue('--design-columns')).toBe('3');
    const child = nested.querySelector('.placement-group') as HTMLElement;
    expect(child.style.getPropertyValue('--design-column')).toBe('2 / span 2');
    child.querySelector<HTMLButtonElement>('.field-card')!.click();
    expect(select).toHaveBeenCalledExactlyOnceWith([0, 0]);
    expect(JSON.stringify(documents)).toBe(original);
  });
  it('keeps invalid draft bindings editable and selects a field without changing the document', async () => {
    const fixture = TestBed.createComponent(FormCanvas);
    const documents = {
      data_schema: { type: 'object', properties: {} },
      render_schema: {
        root: {
          component: 'vertical',
          children: [
            {
              node_key: 'original',
              component: 'text',
              scope: '/properties/missing',
              label: 'Question',
            },
          ],
        },
      },
    };
    fixture.componentRef.setInput('documents', documents);
    fixture.componentRef.setInput('selected', []);
    const select = vi.fn();
    fixture.componentInstance.selectedChange.subscribe(select);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Invalid field scope');
    fixture.nativeElement.querySelector('.field-card').click();
    expect(select).toHaveBeenCalledWith([0]);
    expect(documents.render_schema.root.children[0].node_key).toBe('original');
  });
  it('revokes captured placement commands after context change or disabling', async () => {
    const fixture = TestBed.createComponent(FormCanvas);
    const documents = {
      data_schema: { type: 'object', properties: {} },
      render_schema: {
        root: {
          component: 'vertical',
          children: [
            { component: 'display', node_key: 'owned', label: 'Owned display' },
          ],
        },
      },
    };
    fixture.componentRef.setInput('documents', documents);
    fixture.componentRef.setInput('selected', []);
    await fixture.whenStable();
    const removed = vi.fn();
    fixture.componentInstance.removeRequested.subscribe(removed);
    const item = fixture.componentInstance
      .cards()[0]
      .menu.find((candidate) => candidate.label === 'Remove placement')!;
    const run = (): void =>
      item.command?.({ item, originalEvent: new Event('click') });
    run();
    expect(removed).toHaveBeenCalledExactlyOnceWith([0]);
    fixture.componentRef.setInput('disabled', true);
    run();
    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('documents', structuredClone(documents));
    run();
    expect(removed).toHaveBeenCalledTimes(1);
    expect(documents.render_schema.root.children).toHaveLength(1);
  });
  it('reveals an off-page repair target and forgets a removed page selection', async () => {
    const fixture = TestBed.createComponent(FormCanvas);
    const documents = {
      data_schema: {
        type: 'object',
        properties: { a: { type: 'string' }, b: { type: 'string' } },
      },
      render_schema: {
        root: {
          component: 'vertical',
          children: [
            { component: 'text', label: 'A', scope: '/properties/a' },
            { component: 'text', label: 'B', scope: '/properties/b' },
          ],
        },
      },
      page_settings: {
        pages: [
          { key: 'a', title: 'First', scopes: ['/properties/a'] },
          { key: 'b', title: 'Second', scopes: ['/properties/b'] },
        ],
      },
    };
    fixture.componentRef.setInput('documents', documents);
    fixture.componentRef.setInput('selected', [0]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.pageKey.set('b');
    expect(vm.children([]).map((card) => card.label)).toEqual(['B']);
    fixture.componentRef.setInput('selected', [0]);
    await fixture.whenStable();
    expect(vm.pageKey()).toBe('');
    expect(vm.children([]).map((card) => card.label)).toEqual(['A', 'B']);
    vm.pageKey.set('b');
    fixture.componentRef.setInput('documents', {
      ...documents,
      page_settings: { pages: [documents.page_settings.pages[0]] },
    });
    await fixture.whenStable();
    expect(vm.pageKey()).toBe('');
    fixture.componentRef.setInput('documents', documents);
    await fixture.whenStable();
    expect(vm.pageKey()).toBe('');
    expect(documents.render_schema.root.children).toHaveLength(2);
  });
});
