import { By } from '@angular/platform-browser';
import { FormPages } from '../form-pages/form-pages';
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
  it('retains translation and outcome buffers across modes without clearing the other pending owner', async () => {
    const fixture = TestBed.createComponent(FormSettings);
    fixture.componentRef.setInput('documents', documents);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const discarded = vi.fn();
    const applied = vi.fn();
    vm.discarded.subscribe(discarded);
    vm.applied.subscribe(applied);
    vm.key = 'title';
    vm.en = 'Title';
    vm.fa = 'عنوان';
    fixture.componentRef.setInput('mode', 'settings');
    await fixture.whenStable();
    vm.outcome = 'review';
    vm.applyOutcome();
    expect(applied).not.toHaveBeenCalled();
    vm.discardTranslation();
    expect(discarded).not.toHaveBeenCalled();
    expect(vm.outcome).toBe('review');
    fixture.componentRef.setInput('mode', 'languages');
    await fixture.whenStable();
    expect(vm.outcome).toBe('review');
    vm.applyOutcome();
    expect(applied.mock.lastCall?.[0]['render_schema']['outcomes']).toEqual([
      'review',
    ]);
    expect(vm.outcome).toBe('');
    vm.outcome = 'other';
    vm.key = 'pending';
    vm.discardOutcome();
    expect(discarded).not.toHaveBeenCalled();
    vm.discardTranslation();
    expect(discarded).toHaveBeenCalledOnce();
  });
  it('retains unsaved translations when opening another row and requires explicit discard', async () => {
    const fixture = TestBed.createComponent(FormSettings);
    fixture.componentRef.setInput('documents', {
      ...documents,
      localization: {
        catalogs: {
          en: { first: { text: 'First' }, second: { text: 'Second' } },
          fa: { first: { text: 'اول' }, second: { text: 'دوم' } },
        },
      },
    });
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const discarded = vi.fn();
    vm.discarded.subscribe(discarded);
    vm.editMessage('first');
    expect(vm.translationPending()).toBe(false);
    vm.fa = 'ویرایش نشده';
    vm.editMessage('second');
    expect(vm.key).toBe('first');
    expect(vm.fa).toBe('ویرایش نشده');
    expect(vm.error()).toBe(
      'Apply or discard translation edits before opening another translation.',
    );
    vm.discardTranslation();
    expect(discarded).toHaveBeenCalledOnce();
    expect(vm.translationPending()).toBe(false);
    vm.editMessage('second');
    expect(vm.en).toBe('Second');
    expect(vm.fa).toBe('دوم');
  });
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
    const pages = fixture.debugElement.query(By.directive(FormPages))
      .componentInstance as FormPages;
    pages.changeTitle('Private');
    pages.toggle('/properties/flag', true);
    vm.busy.set(true);
    TestBed.inject(ActorState).reset();
    expect(vm.synthetic()).toEqual({});
    expect(vm.key + vm.en + vm.fa).toBe('');
    expect(pages.title()).toBe('');
    expect(pages.selected()).toEqual([]);
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
    const pages = fixture.debugElement.query(By.directive(FormPages))
      .componentInstance as FormPages;
    pages.changeTitle('First');
    pages.selected.set(['/properties/missing']);
    pages.apply();
    expect(output).not.toHaveBeenCalled();
    pages.selected.set(['/properties/flag']);
    pages.apply();
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
