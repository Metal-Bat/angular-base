import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../core/auth/actor-state';
import { AgentAuthoringApi } from './agent-authoring-api';

const decision = {
  sample_state: 'MISSING',
  options_input_key: 'routes',
  options: [],
  issue_codes: [],
  provider_called: false,
};
const source = {
  report_ref: 'owned-report',
  source_key: 'report.users',
  created_at: '2026-10-28T08:00:00Z',
  definition_version: 1,
  classification: 'INTERNAL',
  fields: ['username'],
  max_rows: 3,
};
function payload(data: unknown): Blob {
  return new Blob([JSON.stringify({ success: true, data })]);
}
describe('Agent authoring producer adapter', () => {
  let http: HttpTestingController;
  let api: AgentAuthoringApi;
  let abort: AbortSignal;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(AgentAuthoringApi);
    abort = new AbortController().signal;
  });
  afterEach(() => http.verify());
  it('uses SelectQuery for owned sources and previews metadata without executing a tool', async () => {
    const work = api.sources('agent', '', 2, abort);
    const request = await vi.waitFor(() =>
      http.expectOne('/api/v1/ai-agents/agent/retrieval-sources/search'),
    );
    expect(request.request.body).toEqual({ page: 2, size: 10 });
    request.flush(
      new Blob([
        JSON.stringify({
          success: true,
          result: {
            items: [source],
            page: 2,
            size: 10,
            total: 11,
            total_pages: 2,
          },
        }),
      ]),
    );
    expect((await work).items[0].maxRows).toBe(3);
    const preview = api.lookup('agent', 'owned-report', 2, abort);
    const lookup = await vi.waitFor(() =>
      http.expectOne('/api/v1/ai-agents/agent/retrieval-preview'),
    );
    expect(lookup.request.body).toEqual({
      report_ref: 'owned-report',
      limit: 2,
    });
    lookup.flush(
      payload({
        agent_ref: 'agent',
        source,
        limit: 2,
        tool_key: 'lookup_saved_report',
        tool_version: '1',
        tool_called: false,
        requires_human_tool_approval: true,
      }),
    );
    expect((await preview).source.fields).toEqual(['username']);
  });
  it('keeps owned draft filtering and the exact governed submission payload and key', async () => {
    const drafts = api.requests(1, abort);
    const list = await vi.waitFor(() =>
      http.expectOne('/api/v1/business-requests/search'),
    );
    expect(list.request.body).toEqual({
      page: 1,
      size: 10,
      scope: 'mine',
      filters: [{ field_name: 'status', operation: 'equal', value: 'DRAFT' }],
      sort_orders: [{ field_name: 'created_at', operation: 'desc' }],
    });
    list.flush(
      new Blob([
        JSON.stringify({
          success: true,
          result: { items: [], page: 1, size: 10, total: 0, total_pages: 0 },
        }),
      ]),
    );
    await drafts;
    const submission = api.evaluate(
      'agent',
      'original-request',
      'original-key',
      abort,
    );
    const request = await vi.waitFor(() =>
      http.expectOne('/api/v1/ai-agents/agent/evaluations'),
    );
    expect(request.request.body).toEqual({
      request_ref: 'original-request',
      submit_key: 'original-key',
    });
    request.flush(
      payload({
        agent_ref: 'agent',
        evidence_kind: 'GOVERNED_REQUEST_SUBMISSION',
        request_ref: 'current-request',
        request_status: 'RUNNING',
        process_ref: 'process',
      }),
    );
    expect(await submission).toEqual({
      request: 'current-request',
      status: 'RUNNING',
      process: 'process',
    });
  });
  it('rejects a context for another workflow step', async () => {
    const work = api
      .context('agent', 'version', 'review', null, abort)
      .catch((error: unknown) => error);
    const request = await vi.waitFor(() =>
      http.expectOne('/api/v1/ai-agents/agent/workflow-context'),
    );
    expect(request.request.body).toEqual({
      workflow_version_ref: 'version',
      step_key: 'review',
      sample_inputs: null,
    });
    request.flush(
      payload({
        agent_ref: 'agent',
        workflow_version_ref: 'version',
        step_key: 'other',
        sample_origin: 'NONE',
        workflow_checksum: null,
        input_schema: null,
        decision,
      }),
    );
    expect(await work).toBeInstanceOf(Error);
  });
  it('discards private data when the actor changes while the response is being decoded', async () => {
    let finish!: (value: string) => void;
    const decoding = new Promise<string>((resolve) => {
      finish = resolve;
    });
    const blob = payload(decision);
    vi.spyOn(blob, 'text').mockReturnValue(decoding);
    const work = api
      .decision('agent', null, abort)
      .catch((error: unknown) => error);
    (
      await vi.waitFor(() =>
        http.expectOne('/api/v1/ai-agents/agent/decision-preview'),
      )
    ).flush(blob);
    TestBed.inject(ActorState).reset();
    finish(JSON.stringify({ success: true, data: decision }));
    expect(await work).toBeInstanceOf(Error);
  });
});
