import { signal as angularSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RUNTIME_OPTIONS } from '../../bindings';
import { RuntimeOptionsPort } from '../../application/runtime-options-port';
import { OptionPage } from '../../domain/option-coordinator';
import { readRuntimeDocument } from '../../infrastructure/runtime-document-adapter';
import { runtimeFixture } from '../../testing/runtime-fixtures';
import { ChoiceControl } from './choice-control';

const page = (generation: number): OptionPage => ({
  state: 'READY',
  generation,
  fingerprint: 'owned',
  revision: 'source',
  locale: 'en',
  page: 1,
  totalPages: 1,
  items: [
    { key: 'json:1', value: 'Confirmed choice' },
    { key: 'json:2', value: 'Other choice' },
  ],
});
async function mount(
  input = runtimeFixture(),
): Promise<ComponentFixture<ChoiceControl>> {
  const result = readRuntimeDocument(input);
  if (result.status !== 'ready') {
    throw Error('Invalid owned runtime fixture');
  }
  const fixture = TestBed.createComponent(ChoiceControl);
  fixture.componentRef.setInput('document', result.document);
  fixture.componentRef.setInput(
    'node',
    result.document.render.children.find(
      (node) => node.scope === '/properties/choice',
    ),
  );
  fixture.componentRef.setInput('data', result.document.canonical);
  fixture.componentRef.setInput('path', '/root/children/3');
  fixture.componentRef.setInput('controlId', 'owned-choice');
  await fixture.whenStable();
  return fixture;
}
describe('Confirmed choice refresh', () => {
  let finish: ((value: OptionPage) => void) | undefined;
  let pendingGeneration = 0;
  let signal: AbortSignal | undefined;
  let calls = 0;
  let fail: ((reason: Error) => void) | undefined;
  beforeEach(() => {
    calls = 0;
    finish = undefined;
    fail = undefined;
    signal = undefined;
    const query: RuntimeOptionsPort['query'] = async (
      _document,
      _pointer,
      _input,
      generation,
      abortSignal,
    ) => {
      if (++calls === 1) {
        return page(generation);
      }
      pendingGeneration = generation;
      signal = abortSignal;
      return new Promise<OptionPage>((resolve, reject) => {
        finish = resolve;
        fail = reject;
      });
    };
    TestBed.configureTestingModule({
      providers: [{ provide: RUNTIME_OPTIONS, useValue: { query } }],
    });
  });
  it('uses a real multiselect for nullable array fields without requiring a presentation override', async () => {
    const input = runtimeFixture();
    input['field_metadata'] = (
      input['field_metadata'] as Record<string, unknown>[]
    ).map((field) =>
      field['scope'] === '/properties/choice'
        ? {
            ...field,
            validation_schema: {
              type: ['array', 'null'],
              items: { type: 'integer' },
            },
          }
        : field,
    );
    input['data'] = {
      ...(input['data'] as Record<string, unknown>),
      choice: [1, 2],
    };
    const fixture = await mount(input);
    await vi.waitFor(() =>
      expect(fixture.componentInstance.optionState()).toBe('ready'),
    );
    expect(fixture.componentInstance.multiple()).toBe(true);
    expect(fixture.nativeElement.querySelector('p-multiselect')).toBeTruthy();
    const edited = vi.fn();
    fixture.componentInstance.edit.subscribe(edited);
    fixture.componentInstance.choose(['json:1', 'json:2']);
    expect(edited.mock.calls[0][0].value).toEqual([1, 2]);
  });
  it('accepts an edited definition while rejecting an unexplained page revision change', async () => {
    const definition = angularSignal<object>({});
    let revision = 'first';
    const port = TestBed.inject(RUNTIME_OPTIONS);
    port.definitionIdentity = (): object => definition();
    port.query = async (
      _document,
      _pointer,
      input,
      generation,
    ): Promise<OptionPage> => ({
      ...page(generation),
      revision,
      page: input.page,
      totalPages: 2,
    });
    const fixture = await mount();
    const vm = fixture.componentInstance;
    await vi.waitFor(() => expect(vm.optionState()).toBe('ready'));
    revision = 'edited-definition';
    definition.set({});
    await fixture.whenStable();
    await vi.waitFor(() =>
      expect(vm.options()?.revision).toBe('edited-definition'),
    );
    expect(vm.optionState()).toBe('ready');
    revision = 'unexpected-during-pagination';
    vm.page.set(2);
    await fixture.whenStable();
    await vi.waitFor(() => expect(vm.optionState()).toBe('error'));
  });
  it('keeps the confirmed label while loading and reports removal only after a current result', async () => {
    const fixture = await mount();
    const vm = fixture.componentInstance;
    await vi.waitFor(() => expect(vm.optionState()).toBe('ready'));
    const confirmed = vm.options();
    const edits = vi.fn();
    vm.edit.subscribe(edits);
    vm.reloadOptions();
    await fixture.whenStable();
    expect(vm.optionState()).toBe('loading');
    expect(vm.options()).toBe(confirmed);
    expect(fixture.nativeElement.textContent).not.toContain('Check selection');
    expect(
      [...fixture.nativeElement.querySelectorAll('select option')].every(
        (option) => (option as HTMLOptionElement).disabled,
      ),
    ).toBe(true);
    vm.choose('json:2');
    expect(edits).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(finish).toBeDefined());
    finish!({
      ...page(pendingGeneration),
      state: 'EMPTY',
      items: [],
      totalPages: 0,
    });
    await vi.waitFor(() => expect(vm.optionState()).toBe('ready'));
    await fixture.whenStable();
    expect(vm.missingOptions()).toEqual(['json:1']);
    expect(fixture.nativeElement.textContent).toContain('Check selection');
    expect(vm.data()['choice']).toBe(1);
    expect(edits).not.toHaveBeenCalled();
  });
  it('aborts the pending read on teardown and cannot apply its late response', async () => {
    const fixture = await mount();
    const vm = fixture.componentInstance;
    await vi.waitFor(() => expect(vm.optionState()).toBe('ready'));
    vm.reloadOptions();
    await fixture.whenStable();
    await vi.waitFor(() => expect(finish).toBeDefined());
    fixture.destroy();
    expect(signal?.aborted).toBe(true);
    finish!({
      ...page(pendingGeneration),
      items: [{ key: 'json:2', value: 'Late private label' }],
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(vm.options()).toBeNull();
  });
  it('clears inaccessible option metadata on failure while retaining the canonical answer', async () => {
    const fixture = await mount();
    const vm = fixture.componentInstance;
    await vi.waitFor(() => expect(vm.optionState()).toBe('ready'));
    const edits = vi.fn();
    vm.edit.subscribe(edits);
    vm.reloadOptions();
    await fixture.whenStable();
    await vi.waitFor(() => expect(fail).toBeDefined());
    fail!(new Error('Unavailable source'));
    await vi.waitFor(() => expect(vm.optionState()).toBe('error'));
    await fixture.whenStable();
    expect(vm.options()).toBeNull();
    expect(vm.data()['choice']).toBe(1);
    expect(fixture.nativeElement.textContent).not.toContain('Confirmed choice');
    expect(fixture.nativeElement.textContent).not.toContain('Check selection');
    expect(fixture.nativeElement.textContent).toContain(
      'The service is unavailable.',
    );
    vm.choose('json:2');
    expect(edits).not.toHaveBeenCalled();
  });
  it('allows removing an unavailable multiple answer without introducing unknown values', async () => {
    const input = runtimeFixture();
    (input['data'] as Record<string, unknown>)['choice'] = [1];
    const metadata = input['field_metadata'] as {
      scope: string;
      validation_schema: unknown;
    }[];
    metadata.find(
      (field) => field.scope === '/properties/choice',
    )!.validation_schema = { type: 'array', items: { type: 'integer' } };
    const fixture = await mount(input);
    const vm = fixture.componentInstance;
    await vi.waitFor(() => expect(vm.optionState()).toBe('ready'));
    vm.reloadOptions();
    await fixture.whenStable();
    await vi.waitFor(() => expect(finish).toBeDefined());
    finish!({
      ...page(pendingGeneration),
      state: 'EMPTY',
      items: [],
      totalPages: 0,
    });
    await vi.waitFor(() => expect(vm.optionState()).toBe('ready'));
    await fixture.whenStable();
    const edits = vi.fn();
    vm.edit.subscribe(edits);
    vm.choose(['json:2']);
    expect(edits).not.toHaveBeenCalled();
    vm.choose([]);
    expect(edits).toHaveBeenCalledExactlyOnceWith({
      scope: '/properties/choice',
      value: [],
    });
    const selected = [
      ...fixture.nativeElement.querySelectorAll('select option'),
    ].find(
      (option) => (option as HTMLOptionElement).value === 'json:1',
    ) as HTMLOptionElement;
    expect(selected.disabled).toBe(false);
  });
  it('uses an unavailable label instead of exposing a missing user reference', async () => {
    const input = runtimeFixture();
    (input['data'] as Record<string, unknown>)['choice'] =
      'opaque/private-user';
    const metadata = input['field_metadata'] as {
      scope: string;
      validation_schema: unknown;
    }[];
    metadata.find(
      (field) => field.scope === '/properties/choice',
    )!.validation_schema = { type: 'string' };
    const render = input['render_schema'] as {
      root: { children: Record<string, unknown>[] };
    };
    render.root.children[3] = {
      component: 'user',
      scope: '/properties/choice',
      label: 'User',
      selector: 'users',
    };
    TestBed.inject(RUNTIME_OPTIONS).query = async (
      _document,
      _pointer,
      _input,
      generation,
    ): Promise<OptionPage> => ({
      ...page(generation),
      state: 'EMPTY',
      items: [],
      totalPages: 0,
    });
    const fixture = await mount(input);
    await vi.waitFor(() =>
      expect(fixture.componentInstance.optionState()).toBe('ready'),
    );
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'Selection unavailable',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'opaque/private-user',
    );
    expect(fixture.componentInstance.data()['choice']).toBe(
      'opaque/private-user',
    );
  });
});
