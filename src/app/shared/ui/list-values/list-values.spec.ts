import { TestBed } from '@angular/core/testing';
import { ListValues } from './list-values';

describe('List filter value editing', () => {
  it('preserves newly typed values when adding and removing rows before another render', () => {
    const fixture = TestBed.createComponent(ListValues);
    fixture.componentRef.setInput('controlId', 'filter-values');
    const editor = fixture.componentInstance;

    editor.update(0, 'first');
    editor.add();
    editor.update(1, 'discard');
    editor.remove(1);
    editor.add();
    editor.update(1, 'second');

    expect(editor.value()).toBe('first\nsecond');
    editor.remove(0);
    expect(editor.value()).toBe('second');
  });
});
