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
  it('repairs an absent locale without changing keys or unrelated metadata', async () => {
    const fixture = TestBed.createComponent(FormSettings);
    const source: JsonObject = {
      ...documents,
      localization: {
        default_locale: 'en',
        catalogs: { en: { title: { text: 'Title', parameters: {} } }, fa: {} },
        revision: 'retained',
      },
    };
    fixture.componentRef.setInput('documents', source);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const output = vi.fn();
    vm.applied.subscribe(output);
    vm.editMessage('title');
    expect(vm.en).toBe('Title');
    expect(vm.fa).toBe('');
    vm.fa = 'عنوان';
    await vm.applyTranslation();
    const localization = output.mock.calls[0][0]['localization'] as JsonObject;
    expect(localization['revision']).toBe('retained');
    const catalogs = localization['catalogs'] as JsonObject;
    expect((catalogs['fa'] as JsonObject)['title']).toMatchObject({
      text: 'عنوان',
      source_revision: expect.any(String),
    });
    expect(output.mock.calls[0][0]['data_schema']).toEqual(
      documents['data_schema'],
    );
  });
  it('does not overwrite edits or apply after draft becomes read-only during hashing', async () => {
    const fixture = TestBed.createComponent(FormSettings);
    fixture.componentRef.setInput('documents', documents);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const output = vi.fn();
    vm.applied.subscribe(output);
    vm.key = 'title';
    vm.en = 'Title';
    vm.fa = 'عنوان';
    const pending = vm.applyTranslation();
    vm.en = 'New title';
    await pending;
    expect(output).not.toHaveBeenCalled();
    expect(vm.en).toBe('New title');
    expect(vm.busy()).toBe(false);
    const published = vm.applyTranslation();
    fixture.componentRef.setInput('disabled', true);
    await published;
    expect(output).not.toHaveBeenCalled();
  });
});
