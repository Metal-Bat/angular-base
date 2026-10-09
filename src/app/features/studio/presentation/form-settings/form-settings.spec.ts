import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { FormSettings } from './form-settings';
const documents: JsonObject = {
  data_schema: { type: 'object', properties: { flag: { type: 'boolean' } } },
  render_schema: {
    root: {
      component: 'vertical',
      children: [
        { component: 'boolean', scope: '/properties/flag', node_key: 'flag' },
      ],
    },
  },
};
describe('Form settings lifecycle', () => {
  it('retains typed samples across document edits and clears all actor-owned buffers', async () => {
    const fixture = TestBed.createComponent(FormSettings);
    fixture.componentRef.setInput('documents', documents);
    await fixture.whenStable();
    fixture.componentRef.setInput('pageAuthoring', true);
    const vm = fixture.componentInstance;
    vm.setSample({ flag: false });
    fixture.componentRef.setInput('documents', {
      ...documents,
      page_settings: { pages: [] },
    });
    await fixture.whenStable();
    expect(vm.synthetic()).toEqual({ flag: false });
    vm.key = 'key';
    vm.en = 'English';
    vm.fa = 'فارسی';
    vm.pageKey = 'page';
    vm.pageTitle = 'Private';
    vm.busy.set(true);
    TestBed.inject(ActorState).reset();
    expect(vm.synthetic()).toEqual({});
    expect(vm.key + vm.en + vm.fa + vm.pageKey + vm.pageTitle).toBe('');
    expect(vm.busy()).toBe(false);
  });
  it('rejects invalid page selections and fences async translations after actor reset', async () => {
    const fixture = TestBed.createComponent(FormSettings);
    fixture.componentRef.setInput('documents', documents);
    await fixture.whenStable();
    fixture.componentRef.setInput('pageAuthoring', true);
    const vm = fixture.componentInstance;
    const output = vi.fn();
    vm.applied.subscribe(output);
    vm.pageKey = 'first';
    vm.pageTitle = 'First';
    vm.selectedScopes = ['/properties/missing'];
    vm.addPage();
    expect(output).not.toHaveBeenCalled();
    vm.selectedScopes = ['/properties/flag'];
    vm.addPage();
    expect(output).toHaveBeenCalledTimes(1);
    vm.key = 'key';
    vm.en = 'English';
    vm.fa = 'فارسی';
    const pending = vm.applyTranslation();
    TestBed.inject(ActorState).reset();
    await pending;
    expect(output).toHaveBeenCalledTimes(1);
  });
});
