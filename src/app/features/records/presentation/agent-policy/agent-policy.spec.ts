import { TestBed } from '@angular/core/testing';
import { AgentPolicy } from './agent-policy';

describe('Agent permitted inputs', () => {
  it('removes an input, its classification and its redaction atomically while preserving other policy', async () => {
    const fixture = TestBed.createComponent(AgentPolicy);
    const policy = {
      allowed_fields: ['question', 'private_note'],
      allowed_classifications: ['PUBLIC', 'CONFIDENTIAL'],
      redacted_fields: ['private_note'],
      allowed_tools: ['lookup_saved_report'],
      allowed_retrieval_sources: ['report.example'],
    };
    fixture.componentRef.setInput('value', policy);
    fixture.componentRef.setInput('classifications', {
      question: 'PUBLIC',
      private_note: 'CONFIDENTIAL',
    });
    await fixture.whenStable();
    const emitted = vi.fn();
    const partial = vi.fn();
    fixture.componentInstance.policyChange.subscribe(emitted);
    fixture.componentInstance.valueChange.subscribe(partial);
    fixture.componentInstance.remove('allowed_fields', 'private_note');
    expect(emitted).toHaveBeenCalledWith({
      policy: { ...policy, allowed_fields: ['question'], redacted_fields: [] },
      classifications: { question: 'PUBLIC' },
    });
    expect(partial).not.toHaveBeenCalled();
    expect(policy.allowed_fields).toEqual(['question', 'private_note']);
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    fixture.componentInstance.remove('allowed_fields', 'question');
    expect(emitted).toHaveBeenCalledTimes(1);
  });
});
