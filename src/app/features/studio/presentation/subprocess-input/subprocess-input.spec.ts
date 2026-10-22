import { TestBed } from '@angular/core/testing';
import { SubprocessInput } from './subprocess-input';
it('retains invalid child input buffers and reports validity independently of other input edits', async () => {
  const f = TestBed.createComponent(SubprocessInput);
  f.componentRef.setInput('port', {
    name: 'amount',
    value_schema: { type: 'integer', minimum: 0 },
  });
  f.componentRef.setInput('sources', []);
  f.componentRef.setInput('value', {
    name: 'amount',
    source_kind: 'CONSTANT',
    constant_value: 3,
  });
  const changed = vi.fn();
  const validity = vi.fn();
  f.componentInstance.changed.subscribe(changed);
  f.componentInstance.validity.subscribe(validity);
  await f.whenStable();
  f.componentInstance.edit(-1);
  await f.whenStable();
  expect(f.componentInstance.constant()).toBe(-1);
  expect(changed).not.toHaveBeenCalled();
  expect(validity).toHaveBeenLastCalledWith(false);
  f.componentRef.setInput('disabled', true);
  await f.whenStable();
  f.componentRef.setInput('disabled', false);
  await f.whenStable();
  expect(f.componentInstance.constant()).toBe(-1);
  f.componentInstance.edit(0);
  await f.whenStable();
  expect(changed).toHaveBeenLastCalledWith(0);
  expect(validity).toHaveBeenLastCalledWith(true);
});
it('keeps sources pending and preserves saved source mappings', async () => {
  const f = TestBed.createComponent(SubprocessInput);
  const source = {
    key: 'request.amount',
    label: 'Amount',
    schema: { type: 'integer' },
    binding: { source_kind: 'REQUEST', source_path: '/amount' },
  };
  f.componentRef.setInput('port', {
    name: 'amount',
    value_schema: { type: 'integer' },
  });
  f.componentRef.setInput('sources', [source]);
  f.componentRef.setInput('value', { name: 'amount', ...source.binding });
  await f.whenStable();
  const applied = vi.fn();
  f.componentInstance.sourceChanged.subscribe(applied);
  f.componentInstance.choose(source.key);
  await f.whenStable();
  expect(f.componentInstance.pending()).toBe(true);
  expect(applied).not.toHaveBeenCalled();
  f.componentInstance.applySource();
  await f.whenStable();
  expect(applied).toHaveBeenCalledExactlyOnceWith({
    key: source.key,
    index: null,
    field: '',
  });
  f.componentInstance.choose('');
  await f.whenStable();
  expect(f.nativeElement.textContent).toContain(
    'Clear the existing child input',
  );
  expect(f.nativeElement.querySelector('app-mapping-constant')).toBeNull();
});
it('fences invalid indices until an indexed field is explicitly applied', async () => {
  const f = TestBed.createComponent(SubprocessInput);
  const source = {
    key: '/lines',
    label: 'request.lines',
    schema: {
      type: 'array',
      items: { type: 'object', properties: { note: { type: 'string' } } },
    },
    binding: { source_kind: 'REQUEST', source_path: '/lines' },
  };
  f.componentRef.setInput('port', {
    name: 'note',
    value_schema: { type: 'string' },
  });
  f.componentRef.setInput('sources', [source]);
  await f.whenStable();
  const applied = vi.fn();
  f.componentInstance.sourceChanged.subscribe(applied);
  expect(f.componentInstance.selectable(source)).toBe(true);
  f.componentInstance.choose('/lines');
  f.componentInstance.collection(-1, '/note');
  f.componentInstance.applySource();
  expect(applied).not.toHaveBeenCalled();
  expect(f.componentInstance.itemIndex()).toBe(-1);
  expect(f.componentInstance.pending()).toBe(true);
  f.componentInstance.collection(0, '/note');
  f.componentInstance.applySource();
  expect(applied).toHaveBeenCalledExactlyOnceWith({
    key: '/lines',
    index: 0,
    field: '/note',
  });
});
