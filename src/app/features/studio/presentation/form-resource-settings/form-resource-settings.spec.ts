import { TestBed } from '@angular/core/testing';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { formOptions } from '../../domain/form-inspector-schema';
import { FormResourceSettings } from './form-resource-settings';

async function setup(
  value: JsonObject,
  validation = false,
): Promise<{
  fixture: ReturnType<typeof TestBed.createComponent<FormResourceSettings>>;
  changes: ReturnType<typeof vi.fn>;
}> {
  const fixture = TestBed.createComponent(FormResourceSettings);
  fixture.componentRef.setInput('identity', {
    component: validation ? 'repeater' : 'attachment_collection',
  });
  fixture.componentRef.setInput('controlId', 'resource');
  fixture.componentRef.setInput('validation', validation);
  fixture.componentRef.setInput('schema', formOptions['attachment_collection']);
  fixture.componentRef.setInput('value', value);
  const changes = vi.fn((next: JsonObject) =>
    fixture.componentRef.setInput('value', next),
  );
  fixture.componentInstance.valueChanged.subscribe((next) =>
    changes(next as JsonObject),
  );
  await fixture.whenStable();
  return { fixture, changes };
}
describe('Purposeful row and media settings', () => {
  it('retains invalid numbers across flag edits, preserving null, false, zero and metadata', async () => {
    const initial = {
      min_items: null,
      max_items: 0,
      allow_remove: false,
      allowed_kinds: [],
      retained: { value: 0 },
    };
    const { fixture, changes } = await setup(initial);
    const vm = fixture.componentInstance;
    vm.number('max_items', '-');
    vm.flag('read_only', 'false');
    await fixture.whenStable();
    expect(vm.valid()).toBe(false);
    expect(vm.numberText('max_items')).toBe('-');
    expect(vm.flagValue('read_only')).toBe('false');
    expect(changes).not.toHaveBeenCalled();
    vm.number('max_items', '۰');
    await fixture.whenStable();
    expect(vm.valid()).toBe(true);
    expect(changes).toHaveBeenLastCalledWith({ ...initial, read_only: false });
    expect(initial).not.toHaveProperty('read_only');
  });
  it('stages contradictory row limits until corrected and never replaces the row item schema', async () => {
    const initial = {
      type: 'array',
      minItems: 0,
      maxItems: 2,
      items: { type: 'object' },
      retained: false,
    };
    const { fixture, changes } = await setup(initial, true);
    const vm = fixture.componentInstance;
    vm.number('minItems', '3');
    expect(vm.valid()).toBe(false);
    expect(changes).not.toHaveBeenCalled();
    vm.number('maxItems', '4');
    await fixture.whenStable();
    expect(changes).toHaveBeenLastCalledWith({
      ...initial,
      minItems: 3,
      maxItems: 4,
    });
    vm.number('minItems', '');
    await fixture.whenStable();
    expect(changes.mock.lastCall?.[0]).not.toHaveProperty('minItems');
    expect(changes.mock.lastCall?.[0].items).toEqual(initial.items);
  });
  it('validates exact MIME entries while retaining invalid text and untouched categories', async () => {
    const { fixture, changes } = await setup({
      allowed_kinds: [],
      allowed_mime_types: null,
    });
    const vm = fixture.componentInstance;
    vm.changeMime('image/*');
    expect(vm.valid()).toBe(false);
    expect(vm.mimeText()).toBe('image/*');
    expect(changes).not.toHaveBeenCalled();
    vm.changeMime('image/webp\napplication/pdf');
    await fixture.whenStable();
    expect(changes).toHaveBeenLastCalledWith({
      allowed_kinds: [],
      allowed_mime_types: ['image/webp', 'application/pdf'],
    });
    vm.changeMime('');
    await fixture.whenStable();
    expect(changes.mock.lastCall?.[0].allowed_mime_types).toBeNull();
  });
  it('keeps byte limits exact and fences all edits on a published version', async () => {
    const { fixture, changes } = await setup({
      max_item_bytes: null,
      max_total_bytes: null,
    });
    const vm = fixture.componentInstance;
    for (const text of ['0', '-1', '1.5', '9007199254740993', '1073741825']) {
      vm.number('max_item_bytes', text);
      expect(vm.valid()).toBe(false);
      expect(changes).not.toHaveBeenCalled();
    }
    vm.number('max_item_bytes', '1073741824');
    await fixture.whenStable();
    expect(changes).toHaveBeenLastCalledWith({
      max_item_bytes: 1073741824,
      max_total_bytes: null,
    });
    changes.mockClear();
    fixture.componentRef.setInput('disabled', true);
    vm.number('max_item_bytes', '1');
    vm.flag('read_only', 'true');
    vm.category('image');
    vm.changeMime('text/plain');
    expect(changes).not.toHaveBeenCalled();
  });
});
