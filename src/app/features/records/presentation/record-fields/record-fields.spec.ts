import { TestBed } from '@angular/core/testing';
import { RecordFields } from './record-fields';
import { RecordField } from '../../domain/records';
import { SchemaInput } from '../../../administration/presentation/schema-input/schema-input';

describe('Consecutive structured form edits', () => {
  it('marks only the affected control and connects its inline error', () => {
    const fixture = TestBed.createComponent(RecordFields);
    fixture.componentRef.setInput('fields', [
      {
        key: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        nullable: false,
      },
      {
        key: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        nullable: false,
      },
    ]);
    fixture.componentRef.setInput('values', {
      username: 'User',
      password: 'short',
    });
    fixture.componentRef.setInput('errors', {
      password: 'Check the field length.',
    });
    fixture.detectChanges();
    const password = fixture.nativeElement.querySelector('#record-password');
    expect(password.getAttribute('aria-invalid')).toBe('true');
    expect(password.getAttribute('aria-describedby')).toBe(
      'record-password-error',
    );
    expect(
      fixture.nativeElement.querySelector('#record-password-error').textContent,
    ).toContain('Check the field length.');
    expect(
      fixture.nativeElement
        .querySelector('#record-username')
        .getAttribute('aria-invalid'),
    ).toBeNull();
    fixture.componentRef.setInput('errors', {});
    fixture.detectChanges();
    expect(password.getAttribute('aria-invalid')).toBeNull();
  });

  it('retains independent field edits made before the next parent render', () => {
    const fixture = TestBed.createComponent(RecordFields);
    const fields: RecordField[] = [
      {
        key: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        nullable: false,
      },
      {
        key: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        nullable: false,
      },
    ];
    fixture.componentRef.setInput('fields', fields);
    fixture.componentRef.setInput('values', { username: '', password: '' });
    fixture.detectChanges();
    const emitted = vi.fn();
    fixture.componentInstance.valuesChange.subscribe(emitted);
    for (const [id, value] of [
      ['record-username', 'New user'],
      ['record-password', 'valid-password'],
    ]) {
      const control = fixture.nativeElement.querySelector(
        '#' + id,
      ) as HTMLInputElement;
      control.value = value;
      control.dispatchEvent(new Event('input', { bubbles: true }));
    }
    expect(emitted.mock.calls.at(-1)?.[0]).toEqual({
      username: 'New user',
      password: 'valid-password',
    });
  });
  it('retains sibling object edits and resets when the parent replaces the value', async () => {
    const fixture = TestBed.createComponent(SchemaInput);
    fixture.componentRef.setInput('schema', {
      type: 'object',
      properties: { first: { type: 'string' }, second: { type: 'integer' } },
    });
    fixture.componentRef.setInput('controlId', 'nested');
    fixture.componentRef.setInput('value', {});
    fixture.detectChanges();
    const emitted = vi.fn();
    fixture.componentInstance.valueChange.subscribe(emitted);
    const first = fixture.nativeElement.querySelector(
      '#nested-first',
    ) as HTMLInputElement;
    first.value = 'Typed';
    first.dispatchEvent(new Event('input', { bubbles: true }));
    const second = fixture.nativeElement.querySelector(
      '#nested-second',
    ) as HTMLInputElement;
    second.value = '0';
    second.dispatchEvent(new Event('input', { bubbles: true }));
    expect(emitted.mock.calls.at(-1)?.[0]).toEqual({
      first: 'Typed',
      second: 0,
    });
    fixture.componentRef.setInput('value', { first: 'Replaced', second: 3 });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(first.value).toBe('Replaced');
    expect(second.value).toBe('3');
  });
});
