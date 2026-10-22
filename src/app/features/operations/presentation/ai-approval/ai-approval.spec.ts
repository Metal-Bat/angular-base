import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FORM_RESOURCES } from '../../../forms/bindings';
import { AiApproval } from './ai-approval';

it('shows the authorized tool parameters as fields while preserving false, zero and nested values', async () => {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: FORM_RESOURCES,
        useValue: {
          approval: vi.fn().mockResolvedValue({
            reference: 'current',
            status: 'PENDING',
            tool: 'lookup',
            version: '1',
            arguments: {
              limit: 0,
              enabled: false,
              options: { label: 'Finance', empty: null },
            },
            expires: '2030-01-01T00:00:00Z',
          }),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(AiApproval);
  fixture.componentRef.setInput('editor', {
    item: signal({ kind: 'AI_APPROVAL' }),
    ownTask: () => true,
    busy: () => false,
    blocked: () => false,
  });
  await fixture.whenStable();
  expect(fixture.nativeElement.querySelector('pre')).toBeNull();
  const fields = fixture.nativeElement.querySelector('app-form-value');
  expect(fields.textContent).toContain('0');
  expect(fields.textContent).toContain('No');
  expect(fields.textContent).toContain('Finance');
  expect(fields.textContent).toContain('Null');
  expect(fixture.nativeElement.textContent).toContain(
    'does not replace a human business decision',
  );
});
