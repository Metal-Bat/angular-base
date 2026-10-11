import { TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import { aiEvidence, orderEvidence } from './process-evidence-decoder';
import { ProcessEvidenceApi } from './process-evidence';
import { caseRecord } from './workspace-decoders';
import { ProcessTracking } from './process-tracking';

const order = {
  operation_id: 'original-operation',
  step_execution_ref_id: 'execution',
  state: 'CONFIRMED',
  receipt: {
    operation_id: 'original-operation',
    receipt_id: 'provider-receipt',
    state: 'CREATED',
    payload_hash: 'a'.repeat(64),
  },
};
const ai = {
  step_execution_ref_id: 'ai-execution',
  attempt_number: 2,
  status: 'SUCCEEDED',
  agent_ref_id: 'historical-agent',
  agent_available: false,
  model_id: 'pinned-model',
  allowed_input_fields: ['quantity'],
  recommendation: { choice: 'review', confidence: 0, needs_review: true },
  budget: {
    currency: 'USD',
    price_version: 'frozen-price',
    unknown_usage: true,
    used: { spend_usd: '0.10' },
    reserved: { spend_usd: '0.25' },
    remaining: { spend_usd: '0.65' },
  },
};
describe('Authorized process evidence', () => {
  it('resolves authorized task tracking without opening the private request form', async () => {
    const call = vi.fn().mockReturnValue(
      of(
        new HttpResponse({
          body: {
            success: true,
            data: {
              ref_id: 'current-request',
              process_ref_id: 'current-process',
            },
          },
        }),
      ),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: { call } }],
    });
    const abort = new AbortController().signal;
    expect(
      await TestBed.inject(ProcessTracking).destination(
        'parent-request',
        abort,
      ),
    ).toBe('current-process');
    expect(call.mock.calls).toEqual([
      [
        'get_request_api_v1_business_requests__ref_id__get',
        { path: { ref_id: 'parent-request' } },
        abort,
      ],
    ]);
  });
  it('maps the actual task parent reference and rejects malformed references', () => {
    const task = {
      ref_id: 'task',
      request_ref_id: 'current-parent',
      status: 'COMPLETED',
    };
    expect(caseRecord(task).request).toBe('current-parent');
    expect(
      caseRecord({ ref_id: 'another-task', status: 'OPEN' }).request,
    ).toBeUndefined();
    expect(() =>
      caseRecord({ ...task, request_ref_id: { copied: 'private' } }),
    ).toThrow();
  });
  it('uses the actual independent PageRequest operations and forwards cancellation', async () => {
    const call = vi.fn().mockImplementation((id: string) =>
      of(
        new HttpResponse({
          body: {
            success: true,
            result: {
              items: id.includes('orders') ? [order] : [ai],
              page: id.includes('orders') ? 2 : 3,
              size: 20,
              total: 60,
              total_pages: 3,
            },
          },
        }),
      ),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: { call } }],
    });
    const abort = new AbortController().signal;
    const result = await TestBed.inject(ProcessEvidenceApi).read(
      'current-process',
      2,
      3,
      abort,
    );
    expect(call.mock.calls).toEqual([
      [
        'search_sandbox_orders_api_v1_processes__ref_id__orders_search_post',
        { path: { ref_id: 'current-process' }, body: { page: 2, size: 20 } },
        abort,
      ],
      [
        'search_process_ai_evidence_api_v1_processes__ref_id__ai_evidence_search_post',
        { path: { ref_id: 'current-process' }, body: { page: 3, size: 20 } },
        abort,
      ],
    ]);
    expect(result.orders.items[0].receipt?.state).toBe('CREATED');
    expect(result.ai.items[0]).toMatchObject({
      agent: 'historical-agent',
      agentAvailable: false,
      model: 'pinned-model',
      recommendation: { confidence: 0, needsReview: true },
      budget: { unknown: true, reserved: '0.25' },
    });
  });
  it('never infers a receipt from unknown dispatch and rejects mismatched receipt identities', () => {
    expect(
      orderEvidence({ ...order, state: 'UNKNOWN', receipt: null }).receipt,
    ).toBeNull();
    expect(() => orderEvidence({ ...order, state: 'UNKNOWN' })).toThrow();
    expect(() =>
      orderEvidence({
        ...order,
        receipt: { ...order.receipt, operation_id: 'another' },
      }),
    ).toThrow();
    expect(() =>
      orderEvidence({
        ...order,
        receipt: { ...order.receipt, payload_hash: 'invalid' },
      }),
    ).toThrow();
  });
  it('preserves queued no-recommendation evidence and fails closed on malformed public fields', () => {
    expect(
      aiEvidence({
        ...ai,
        status: 'QUEUED',
        recommendation: null,
        budget: null,
      }),
    ).toMatchObject({
      status: 'QUEUED',
      recommendation: null,
      budget: null,
    });
    expect(() => aiEvidence({ ...ai, agent_available: 'false' })).toThrow();
    expect(() => aiEvidence({ ...ai, allowed_input_fields: [123] })).toThrow();
    expect(() =>
      aiEvidence({
        ...ai,
        recommendation: { ...ai.recommendation, confidence: 2 },
      }),
    ).toThrow();
  });
});
