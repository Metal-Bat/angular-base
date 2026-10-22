import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { FormPages } from './form-pages';
const documents: JsonObject = {
  data_schema: { type: 'object', properties: {} },
  render_schema: { root: { component: 'vertical' } },
  page_settings: { retained: false },
};
async function setup(): Promise<
  ReturnType<typeof TestBed.createComponent<FormPages>>
> {
  const fixture = TestBed.createComponent(FormPages);
  fixture.componentRef.setInput('documents', documents);
  fixture.componentRef.setInput('fields', [
    { path: [0], label: 'Name', scope: '/properties/name', identity: 'name' },
    { path: [1], label: 'Rows', scope: '/properties/rows', identity: 'rows' },
    {
      path: [1, 0],
      label: 'Note',
      scope: '/properties/rows/items/properties/note',
      identity: 'note',
    },
  ]);
  await fixture.whenStable();
  return fixture;
}
describe('Purposeful form pages', () => {
  it('uses generated identities and whole repeated groups without changing canonical fields', async () => {
    const fixture = await setup();
    const vm = fixture.componentInstance;
    const output = vi.fn();
    vm.applied.subscribe(output);
    expect(vm.assignable().map((field) => field.label)).toEqual([
      'Name',
      'Rows',
    ]);
    vm.changeTitle('Details');
    vm.toggle('/properties/name', true);
    vm.toggle('/properties/rows/items/properties/note', true);
    expect(vm.selected()).toEqual(['/properties/name']);
    expect(vm.pending()).toBe(true);
    vm.apply();
    expect(output).toHaveBeenCalledWith({
      ...documents,
      page_settings: {
        retained: false,
        pages: [
          { key: 'page_1', title: 'Details', scopes: ['/properties/name'] },
        ],
      },
    });
    expect(output.mock.calls[0][0].data_schema).toBe(documents['data_schema']);
    expect(vm.pending()).toBe(false);
  });
  it('retains incomplete input across modes, fences other pending work and clears actor-owned drafts', async () => {
    const fixture = await setup();
    const vm = fixture.componentInstance;
    const output = vi.fn();
    vm.applied.subscribe(output);
    vm.changeTitle('Private unfinished title');
    expect(vm.canApply()).toBe(false);
    vm.toggle('/properties/rows', true);
    fixture.componentRef.setInput('blocked', true);
    vm.apply();
    expect(output).not.toHaveBeenCalled();
    expect(vm.title()).toBe('Private unfinished title');
    fixture.componentRef.setInput('blocked', false);
    expect(vm.canApply()).toBe(true);
    TestBed.inject(ActorState).reset();
    expect(vm.title()).toBe('');
    expect(vm.selected()).toEqual([]);
    expect(vm.pending()).toBe(false);
  });
  it('refuses stale draft application and published edits', async () => {
    const fixture = await setup();
    const vm = fixture.componentInstance;
    const output = vi.fn();
    vm.applied.subscribe(output);
    vm.changeTitle('Old context');
    vm.toggle('/properties/name', true);
    fixture.componentRef.setInput('documents', {
      ...documents,
      page_settings: { retained: 'new' },
    });
    vm.apply();
    expect(output).not.toHaveBeenCalled();
    expect(vm.error()).toBe(
      'Page settings changed. Discard page edits and reload.',
    );
    await fixture.whenStable();
    expect(vm.title()).toBe('');
    fixture.componentRef.setInput('disabled', true);
    vm.changeTitle('Forbidden');
    vm.toggle('/properties/name', true);
    vm.apply();
    expect(vm.title()).toBe('');
    expect(output).not.toHaveBeenCalled();
  });
  it('preserves an existing page key and missing assignment when changing its title', async () => {
    const fixture = await setup();
    const vm = fixture.componentInstance;
    fixture.componentRef.setInput('documents', {
      ...documents,
      page_settings: {
        pages: [
          {
            key: 'stored',
            title: 'Before',
            scopes: ['/properties/old'],
            private_metadata: { zero: 0 },
          },
        ],
      },
    });
    await fixture.whenStable();
    vm.edit(vm.pages()![0]);
    vm.changeTitle('After');
    const output = vi.fn();
    vm.applied.subscribe(output);
    vm.apply();
    expect(output.mock.calls[0][0].page_settings.pages[0]).toEqual({
      key: 'stored',
      title: 'After',
      scopes: ['/properties/old'],
      private_metadata: { zero: 0 },
    });
  });
});
