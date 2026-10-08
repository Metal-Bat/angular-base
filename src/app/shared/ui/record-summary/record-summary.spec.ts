import { TestBed } from '@angular/core/testing';
import { RecordSummary } from './record-summary';
describe('Record summary', () => {
  it('presents business information without opaque references, secrets or raw fields', async () => {
    const fixture = TestBed.createComponent(RecordSummary);
    const record = {
      name: 'Expense approval',
      code: 'expenses',
      status: 'PUBLISHED',
      workflow_ref_id: 'private-parent-reference',
      ref_id: 'private-version-reference',
      graph_checksum: 'internal-checksum',
      secret: 'private-secret',
      created_at: '2026-10-04T08:00:00Z',
    };
    fixture.componentRef.setInput('record', record);
    fixture.componentRef.setInput('title', 'Expense approval');
    await fixture.whenStable();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Expense approval');
    expect(text).toContain('PUBLISHED');
    expect(text).toContain('Activity');
    expect(text).toContain('UTC');
    expect(text).not.toMatch(
      /private-|internal-checksum|Ref Id|graph_checksum/,
    );
    expect(record.ref_id).toBe('private-version-reference');
  });
  it('groups account information and marks deleted records without editable controls', async () => {
    const fixture = TestBed.createComponent(RecordSummary);
    fixture.componentRef.setInput('record', {
      username: 'Ali',
      email: 'ali@example.test',
      first_name: 'Ali',
      deleted_at: '2026-10-04T08:00:00Z',
      is_active: false,
    });
    fixture.componentRef.setInput('title', 'Ali');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Deleted');
    expect(fixture.nativeElement.textContent).toContain('ali@example.test');
    expect(
      fixture.nativeElement.querySelector('input,textarea,select'),
    ).toBeNull();
  });
});
describe('Response detail coverage and history comparison', () => {
  it('shows additional response properties instead of relying on a whitelist', async () => {
    const fixture = TestBed.createComponent(RecordSummary);
    fixture.componentRef.setInput('record', {
      name: 'Review',
      retry_limit: 0,
      settings: { allow_retry: false },
      reviewers: [{ name: 'Sara' }],
      notes: null,
    });
    fixture.componentRef.setInput('title', 'Review');
    await fixture.whenStable();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Retry Limit');
    expect(text).toContain('0');
    expect(text).toContain('Allow Retry');
    expect(text).toContain('No');
    expect(text).toContain('Sara');
    expect(text).toContain('Not set');
  });
  it('renders restore changes in comparison rows without technical metadata or JSON', async () => {
    const fixture = TestBed.createComponent(RecordSummary);
    fixture.componentRef.setInput('record', {
      operation: 'restore',
      id: 'private-id',
      actor_id: 'private-actor',
      from_values: {
        name: null,
        description: null,
        password: 'private-password',
      },
      to_values: { name: 'test_2', description: 'test' },
    });
    fixture.componentRef.setInput('title', 'restore');
    await fixture.whenStable();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Name');
    expect(rows[0].textContent).toContain('No value');
    expect(rows[0].textContent).toContain('test_2');
    expect(fixture.nativeElement.textContent).not.toMatch(
      /private-|\{\s*"name"/,
    );
  });
});
