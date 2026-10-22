import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import {
  OptionInput,
  OptionPage,
} from '../../../forms/domain/option-coordinator';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { STUDIO_API } from '../../bindings';
import { FormRuleResource } from './form-rule-resource';

function page(generation: number, label = 'Reviewer'): OptionPage {
  return {
    state: 'READY',
    generation,
    locale: 'en',
    fingerprint: 'dependencies',
    revision: 'source',
    items: [{ key: 'json:"private-user"', value: label }],
    page: 1,
    totalPages: 2,
  };
}
async function setup(summary = false): Promise<{
  fixture: ReturnType<typeof TestBed.createComponent<FormRuleResource>>;
  options: ReturnType<typeof vi.fn>;
}> {
  const options = vi.fn(
    async (
      _documents: JsonObject,
      _pointer: string,
      _query: OptionInput,
      generation: number,
    ) => page(generation),
  );
  TestBed.configureTestingModule({
    providers: [{ provide: STUDIO_API, useValue: { options } }],
  });
  const fixture = TestBed.createComponent(FormRuleResource);
  fixture.componentRef.setInput('documents', {
    render_schema: { root: { component: 'user', scope: '/properties/owner' } },
  });
  fixture.componentRef.setInput('field', {
    path: [],
    scope: '/properties/owner',
    label: 'Owner',
    identity: 'owner',
  });
  fixture.componentRef.setInput('data', { flag: false, amount: 0 });
  fixture.componentRef.setInput('summaryOnly', summary);
  if (summary) {
    fixture.componentRef.setInput('summaryValue', 'private-user');
  }
  await fixture.whenStable();
  await vi.waitFor(() =>
    expect(fixture.componentInstance.result()).not.toBeNull(),
  );
  await fixture.whenStable();
  return { fixture, options };
}
describe('Authorized rule resource values', () => {
  it('does not reauthorize cached choices after a failed reload', async () => {
    const { fixture, options } = await setup();
    const vm = fixture.componentInstance;
    const picked = vi.fn();
    vm.picked.subscribe(picked);
    options.mockRejectedValueOnce(Error('Private permission failure'));
    await vm.load(1, true);
    vm.choose('json:"private-user"');
    expect(picked).not.toHaveBeenCalled();
    expect(vm.result()).toBeNull();
    expect(vm.status()).toBe('The service is unavailable.');
  });
  it('cleans up without emitting into destroyed component outputs', async () => {
    const { fixture } = await setup();
    const warning = vi.spyOn(console, 'warn');
    fixture.destroy();
    expect(warning).not.toHaveBeenCalled();
  });
  it('picks only a current returned option and emits its canonical scalar with its readable label', async () => {
    const { fixture, options } = await setup();
    const vm = fixture.componentInstance;
    const picked = vi.fn();
    vm.picked.subscribe(picked);
    vm.choose('json:"copied-ref"');
    expect(picked).not.toHaveBeenCalled();
    vm.choose('json:"private-user"');
    expect(picked).toHaveBeenCalledWith({
      value: 'private-user',
      label: 'Reviewer',
    });
    expect(options.mock.calls[0][2]).toMatchObject({
      data: { flag: false, amount: 0 },
      indices: [],
      selected: [],
    });
    expect(fixture.nativeElement.textContent).not.toContain('private-user');
  });
  it('resolves a saved comparison through selected-key lookup without exposing its opaque value', async () => {
    const { fixture, options } = await setup(true);
    expect(options.mock.calls[0][2].selected).toEqual(['json:"private-user"']);
    expect(fixture.nativeElement.textContent).toContain('Reviewer');
    expect(fixture.nativeElement.textContent).not.toContain('private-user');
  });
  it('fences a late result and clears private labels after actor reset', async () => {
    const { fixture, options } = await setup();
    let resolve!: (result: OptionPage) => void;
    options.mockImplementationOnce(
      (
        _documents: JsonObject,
        _pointer: string,
        _query: OptionInput,
        generation: number,
      ) =>
        new Promise<OptionPage>((done) => {
          resolve = (result): void => done({ ...result, generation });
        }),
    );
    const loading = fixture.componentInstance.load(2);
    TestBed.inject(ActorState).reset();
    resolve(page(0, 'Private late label'));
    await loading;
    await fixture.whenStable();
    expect(fixture.componentInstance.result()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain(
      'Private late label',
    );
    expect(fixture.componentInstance.busy()).toBe(false);
  });
  it('immediately refuses a retained choice after its dependency data changes', async () => {
    const { fixture } = await setup();
    const picked = vi.fn();
    fixture.componentInstance.picked.subscribe(picked);
    fixture.componentRef.setInput('data', { flag: true });
    fixture.componentInstance.choose('json:"private-user"');
    expect(picked).not.toHaveBeenCalled();
    fixture.componentRef.setInput('disabled', true);
    fixture.componentInstance.searchFor('Private text');
    expect(fixture.componentInstance.search()).toBe('');
  });
});
