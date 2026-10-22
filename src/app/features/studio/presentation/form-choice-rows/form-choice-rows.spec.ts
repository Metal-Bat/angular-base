import { Locale } from '../../../../core/localization/locale';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { FormChoiceRows } from './form-choice-rows';

describe('Form choice rows', () => {
  it('offers named choice labels and stable values instead of recursive value fields', async () => {
    const fixture = TestBed.createComponent(FormChoiceRows);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Add choice');
    expect(fixture.nativeElement.textContent).not.toContain('Value 1');
  });
});

describe('Typed choice editing', () => {
  const setup = async (): Promise<{
    fixture: ComponentFixture<FormChoiceRows>;
    vm: FormChoiceRows;
    emit: ReturnType<typeof vi.fn>;
  }> => {
    const fixture = TestBed.createComponent(FormChoiceRows);
    fixture.componentRef.setInput('value', [
      {
        key: 0,
        value: 'Zero',
        message: { key: 'zero', arguments: {} },
        matches: { enabled: false },
      },
      { key: false, value: 'No' },
      { key: '0', value: 'Text zero' },
    ]);
    await fixture.whenStable();
    const emit = vi.fn();
    fixture.componentInstance.valueChange.subscribe(emit);
    return { fixture, vm: fixture.componentInstance, emit };
  };
  it('preserves typed zero, false, string keys and metadata through reorder', async () => {
    const { vm, emit } = await setup();
    vm.move(vm.rows()[0].id, 1);
    expect(emit.mock.lastCall?.[0]).toEqual([
      { key: false, value: 'No' },
      {
        key: 0,
        value: 'Zero',
        message: { key: 'zero', arguments: {} },
        matches: { enabled: false },
      },
      { key: '0', value: 'Text zero' },
    ]);
  });
  it('retains invalid numeric text without converting empty input to zero or emitting a document', async () => {
    const { fixture, vm, emit } = await setup();
    const changed = vi.fn();
    const validity = vi.fn();
    vm.changed.subscribe(changed);
    vm.validity.subscribe(validity);
    const id = vm.rows()[0].id;
    vm.update(id, 'text', '');
    await fixture.whenStable();
    expect(vm.valid()).toBe(false);
    expect(vm.rows()[0].text).toBe('');
    expect(emit).not.toHaveBeenCalled();
    expect(changed).toHaveBeenCalledOnce();
    expect(validity).toHaveBeenLastCalledWith(false);
    vm.update(id, 'text', '1e999');
    expect(emit).not.toHaveBeenCalled();
    vm.update(id, 'text', '-2.5');
    expect(emit.mock.lastCall?.[0][0].key).toBe(-2.5);
    expect(vm.valid()).toBe(true);
  });
  it('keeps row identity and input buffers on the parent echo, and resets on field change', async () => {
    const { fixture, vm, emit } = await setup();
    const id = vm.rows()[0].id;
    vm.update(id, 'label', 'Renamed zero');
    fixture.componentRef.setInput('value', emit.mock.lastCall?.[0]);
    await fixture.whenStable();
    expect(vm.rows()[0].id).toBe(id);
    vm.update(id, 'text', '-');
    fixture.componentRef.setInput('identity', 'other-field');
    await fixture.whenStable();
    expect(vm.rows()[0].text).toBe('0');
    expect(vm.rows()[0].id).not.toBe(id);
  });
  it('keeps precision-losing numeric choice text without emitting a rounded key', async () => {
    const { vm, emit } = await setup();
    const id = vm.rows()[0].id;
    for (const text of [
      '9007199254740993',
      '0.10000000000000000001',
      '1e-324',
    ]) {
      vm.update(id, 'text', text);
      expect(vm.valid()).toBe(false);
      expect(vm.rows()[0].text).toBe(text);
      expect(emit).not.toHaveBeenCalled();
    }
    vm.update(id, 'text', '۱۲٫۵۰');
    expect(vm.valid()).toBe(true);
    expect(emit.mock.lastCall?.[0][0].key).toBe(12.5);
  });
  it('keeps invalid newly added rows until repaired and enforces count and disabled guards', async () => {
    const { fixture, vm, emit } = await setup();
    vm.add();
    const added = vm.rows().at(-1)!;
    expect(vm.valid()).toBe(false);
    expect(emit).not.toHaveBeenCalled();
    vm.update(added.id, 'label', 'New option');
    expect(vm.valid()).toBe(true);
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    const before = structuredClone(vm.rows());
    vm.add();
    vm.remove(added.id);
    vm.move(added.id, -1);
    vm.update(added.id, 'text', 'forbidden');
    expect(vm.rows()).toEqual(before);
    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput(
      'value',
      Array.from({ length: 256 }, (_, key) => ({ key, value: String(key) })),
    );
    await fixture.whenStable();
    vm.add();
    expect(vm.rows()).toHaveLength(256);
    fixture.componentRef.setInput('value', [{ key: false, value: 'Only' }]);
    await fixture.whenStable();
    vm.remove(vm.rows()[0].id);
    expect(vm.rows()).toHaveLength(1);
  });
  it('preserves unsupported configurations and clears private local buffers on actor reset', async () => {
    const { fixture, vm, emit } = await setup();
    fixture.componentRef.setInput('value', [
      { key: { legacy: true }, value: 'Legacy' },
    ]);
    await fixture.whenStable();
    expect(vm.editable()).toBe(false);
    vm.add();
    expect(emit).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Existing settings are preserved',
    );
    TestBed.inject(ActorState).reset();
    expect(vm.rows()).toEqual([]);
  });
});

describe('Choice canonical contract', () => {
  it('rejects typed duplicates and incompatible canonical keys without rewriting the schema', async () => {
    const fixture = TestBed.createComponent(FormChoiceRows);
    fixture.componentRef.setInput('schema', { type: 'number', minimum: 0 });
    fixture.componentRef.setInput('value', [
      { key: 0, value: 'Zero' },
      { key: 1, value: 'One' },
    ]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const emit = vi.fn();
    vm.valueChange.subscribe(emit);
    const second = vm.rows()[1].id;
    vm.update(second, 'text', '0');
    expect(vm.issue(vm.rows()[1])).toBe('Choice values must be unique.');
    expect(emit).not.toHaveBeenCalled();
    vm.update(second, 'text', '-1');
    expect(vm.issue(vm.rows()[1])).toBe('Below minimum');
    vm.update(second, 'type', 'string');
    expect(vm.issue(vm.rows()[1])).toBe('Invalid value type');
    expect(emit).not.toHaveBeenCalled();
    expect(vm.schema()).toEqual({ type: 'number', minimum: 0 });
  });
  it('allows an explicit key type edit for an authoring owner without bypassing constraints', async () => {
    const fixture = TestBed.createComponent(FormChoiceRows);
    fixture.componentRef.setInput('schema', { type: 'string' });
    fixture.componentRef.setInput('allowTypeChange', true);
    fixture.componentRef.setInput('value', [
      { key: 'first', value: 'First' },
      { key: 'second', value: 'Second' },
    ]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.update(vm.rows()[1].id, 'type', 'number');
    vm.update(vm.rows()[1].id, 'text', '0');
    expect(vm.issue(vm.rows()[1])).toBeNull();
    expect(vm.schema()).toEqual({ type: 'string' });
    fixture.componentRef.setInput('schema', {
      type: 'string',
      enum: ['first', 'second'],
    });
    await fixture.whenStable();
    expect(vm.issue(vm.rows()[1])).toBeTruthy();
  });
  it('bounds rendered rows and retains unfinished values across local paging', async () => {
    const fixture = TestBed.createComponent(FormChoiceRows);
    fixture.componentRef.setInput(
      'value',
      Array.from({ length: 42 }, (_, key) => ({ key, value: String(key) })),
    );
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(20);
    vm.update(vm.rows()[0].id, 'text', '-');
    vm.page.set(3);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(2);
    vm.page.set(1);
    await fixture.whenStable();
    expect(vm.rows()[0].text).toBe('-');
    expect(vm.valid()).toBe(false);
  });
});

describe('Localized choice validation', () => {
  it('keeps the invalid buffer and renders Persian and Arabic constraint guidance', async () => {
    const fixture = TestBed.createComponent(FormChoiceRows);
    fixture.componentRef.setInput('schema', { type: 'number', minimum: 0 });
    fixture.componentRef.setInput('value', [{ key: 0, value: 'Zero' }]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const emitted = vi.fn();
    vm.valueChange.subscribe(emitted);
    vm.update(vm.rows()[0].id, 'text', '۱۲٫۵');
    expect(emitted.mock.lastCall?.[0][0].key).toBe(12.5);
    expect(vm.rows()[0].text).toBe('۱۲٫۵');
    vm.update(vm.rows()[0].id, 'text', '-1');
    await TestBed.inject(Locale).set('fa');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('کمتر از حداقل مجاز');
    expect(vm.rows()[0].text).toBe('-1');
    await TestBed.inject(Locale).set('ar');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'أقل من الحد الأدنى المسموح',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Below minimum');
    expect(vm.valid()).toBe(false);
    expect(vm.rows()[0].text).toBe('-1');
  });
});
