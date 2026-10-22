import { renderedField } from './field-focus';

it('chooses a visible read-only placement instead of a hidden first placement or neighboring field', () => {
  const host = document.createElement('div');
  host.innerHTML =
    '<app-runtime-node data-field-pointer="/count"><input id="field-%2Fcount"></app-runtime-node>' +
    '<app-runtime-node data-field-pointer="/count">' +
    '<output id="field-%2Fcount--repeat" tabindex="0">42</output></app-runtime-node>';
  const output = host.querySelector('output')!;
  vi.spyOn(output, 'getClientRects').mockReturnValue([
    {},
  ] as unknown as DOMRectList);
  expect(renderedField(host, '/count')).toBe(output);
  expect(renderedField(host, '/count_extra')).toBeNull();
});
it('targets the collection container rather than an unrelated child input', () => {
  const host = document.createElement('div');
  host.innerHTML =
    '<app-runtime-node data-field-pointer="/rows"><fieldset><legend>Items</legend>' +
    '<input id="field-%2Frows%2F0%2Fnote"></fieldset></app-runtime-node>';
  const collection = host.querySelector('fieldset')!;
  vi.spyOn(collection, 'getClientRects').mockReturnValue([
    {},
  ] as unknown as DOMRectList);
  expect(renderedField(host, '/rows')).toBe(collection);
});
it('keeps group navigation on its own container instead of a nested collection', () => {
  const host = document.createElement('div');
  host.innerHTML =
    '<app-runtime-node data-field-pointer="/group"><section aria-label="Group">' +
    '<app-runtime-node data-field-pointer="/other"><fieldset><legend>Other</legend>' +
    '<input id="field-%2Fgroup--repeat"></fieldset></app-runtime-node></section></app-runtime-node>';
  const group = host.querySelector('section')!;
  const input = host.querySelector('input')!;
  vi.spyOn(group, 'getClientRects').mockReturnValue([
    {},
  ] as unknown as DOMRectList);
  vi.spyOn(input, 'getClientRects').mockReturnValue([
    {},
  ] as unknown as DOMRectList);
  expect(renderedField(host, '/group')).toBe(group);
});
