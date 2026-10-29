import { inject, Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ActorState } from '../../../core/auth/actor-state';
import { ApiClient } from '../../../core/transport/api-client';
import {
  ApiOperationId,
  RequestInput,
} from '../../../core/transport/api-types';
import { record } from '../../../core/transport/api-failure';
import {
  readData,
  readResultPage,
} from '../../../core/transport/response-adapters';
import { JsonObject } from '../../../shared/domain/json-value';
import {
  AgentAuthoringPort,
  AgentChoicePreview,
  AgentEvaluation,
  AgentEvaluationRequest,
  AgentLookupPreview,
  AgentPage,
  AgentReportSource,
  AgentWorkflowContext,
  NamedAgentResource,
} from '../application/agent-authoring-port';
import {
  choicePreview,
  evaluationRequest,
  optionalText,
  reportSource,
  schema,
  text,
} from './agent-authoring-decoders';

@Injectable({ providedIn: 'root' })
export class AgentAuthoringApi implements AgentAuthoringPort {
  private readonly api = inject(ApiClient);
  private readonly actor = inject(ActorState);
  private async call(
    id: ApiOperationId,
    body: JsonObject | undefined,
    path: Record<string, string> | undefined,
    abort: AbortSignal,
  ): Promise<HttpResponse<unknown>> {
    const epoch = this.actor.epoch;
    const response = await firstValueFrom(
      this.api.call(
        id,
        {
          ...(body ? { body } : {}),
          ...(path ? { path } : {}),
        } as RequestInput<typeof id>,
        abort,
      ),
    );
    if (epoch !== this.actor.epoch || abort.aborted) {
      throw Error('Access changed');
    }
    return response;
  }
  async workflows(
    search: string,
    page: number,
    abort: AbortSignal,
  ): Promise<AgentPage<NamedAgentResource>> {
    return readResultPage(
      await this.call(
        'search_workflows_api_v1_workflows_search_post',
        {
          page,
          size: 10,
          filters: [
            { field_name: 'is_active', operation: 'equal', value: true },
            ...(search
              ? [{ field_name: 'name', operation: 'contains', value: search }]
              : []),
          ],
          sort_orders: [{ field_name: 'name', operation: 'asc' }],
        },
        undefined,
        abort,
      ),
      (value) => {
        const row = record(value);
        return { ref: text(row, 'ref_id'), name: text(row, 'name') };
      },
    );
  }
  async versions(
    workflow: string,
    page: number,
    abort: AbortSignal,
  ): Promise<AgentPage<NamedAgentResource>> {
    return readResultPage(
      await this.call(
        'search_versions_api_v1_workflow_versions_search_post',
        {
          workflow_ref_id: workflow,
          page,
          size: 10,
          filters: [
            {
              field_name: 'status',
              operation: 'in',
              value: ['DRAFT', 'PUBLISHED'],
            },
          ],
          sort_orders: [{ field_name: 'number', operation: 'desc' }],
        },
        undefined,
        abort,
      ),
      (value) => {
        const row = record(value);
        if (
          !Number.isSafeInteger(row['number']) ||
          !['DRAFT', 'PUBLISHED'].includes(String(row['status']))
        ) {
          throw Error('Invalid workflow version');
        }
        return {
          ref: text(row, 'ref_id'),
          name: String(row['number']),
          status: text(row, 'status'),
        };
      },
    );
  }
  async steps(
    version: string,
    agent: string,
    abort: AbortSignal,
  ): Promise<readonly NamedAgentResource[]> {
    const graph = readData(
      await this.call(
        'get_graph_api_v1_workflow_versions__ref_id__graph_get',
        undefined,
        { ref_id: version },
        abort,
      ),
      record,
    );
    if (!Array.isArray(graph['steps']) || graph['steps'].length > 256) {
      throw Error('Invalid workflow graph');
    }
    return graph['steps'].flatMap((value) => {
      const step = record(value);
      return step['type_code'] === 'AI_DECISION' &&
        record(step['config'])['agent_ref'] === agent
        ? [{ ref: text(step, 'key'), name: text(step, 'key') }]
        : [];
    });
  }
  async context(
    agent: string,
    version: string,
    step: string,
    sample: JsonObject | null,
    abort: AbortSignal,
  ): Promise<AgentWorkflowContext> {
    return readData(
      await this.call(
        'agent_workflow_context_api_v1_ai_agents__ref_id__workflow_context_post',
        {
          workflow_version_ref: version,
          step_key: step,
          sample_inputs: sample,
        },
        { ref_id: agent },
        abort,
      ),
      (value) => {
        const row = record(value);
        const origin = text(row, 'sample_origin');
        if (
          row['agent_ref'] !== agent ||
          row['workflow_version_ref'] !== version ||
          row['step_key'] !== step ||
          !['AUTHOR', 'CONSTANT_BINDING', 'NONE'].includes(origin)
        ) {
          throw Error('Workflow context changed');
        }
        return {
          version,
          step,
          checksum: optionalText(row, 'workflow_checksum'),
          schema: schema(row['input_schema']),
          origin: origin as AgentWorkflowContext['origin'],
          decision: choicePreview(row['decision']),
        };
      },
    );
  }
  async decision(
    agent: string,
    sample: JsonObject | null,
    abort: AbortSignal,
  ): Promise<AgentChoicePreview> {
    return readData(
      await this.call(
        'preview_agent_decision_api_v1_ai_agents__ref_id__decision_preview_post',
        { sample_inputs: sample },
        { ref_id: agent },
        abort,
      ),
      choicePreview,
    );
  }
  async sources(
    agent: string,
    search: string,
    page: number,
    abort: AbortSignal,
  ): Promise<AgentPage<AgentReportSource>> {
    return readResultPage(
      await this.call(
        'agent_retrieval_sources_api_v1_ai_agents__ref_id__retrieval_sources_search_post',
        { page, size: 10, ...(search ? { search } : {}) },
        { ref_id: agent },
        abort,
      ),
      reportSource,
    );
  }
  async lookup(
    agent: string,
    report: string,
    limit: number,
    abort: AbortSignal,
  ): Promise<AgentLookupPreview> {
    return readData(
      await this.call(
        'agent_retrieval_preview_api_v1_ai_agents__ref_id__retrieval_preview_post',
        { report_ref: report, limit },
        { ref_id: agent },
        abort,
      ),
      (value) => {
        const row = record(value);
        const source = reportSource(row['source']);
        if (
          row['agent_ref'] !== agent ||
          source.ref !== report ||
          row['limit'] !== limit ||
          row['tool_key'] !== 'lookup_saved_report' ||
          row['tool_version'] !== '1' ||
          row['tool_called'] !== false ||
          row['requires_human_tool_approval'] !== true
        ) {
          throw Error('Saved lookup preview changed');
        }
        return { source, limit };
      },
    );
  }
  async requests(
    page: number,
    abort: AbortSignal,
  ): Promise<AgentPage<AgentEvaluationRequest>> {
    return readResultPage(
      await this.call(
        'search_requests_api_v1_business_requests_search_post',
        {
          page,
          size: 10,
          scope: 'mine',
          filters: [
            { field_name: 'status', operation: 'equal', value: 'DRAFT' },
          ],
          sort_orders: [{ field_name: 'created_at', operation: 'desc' }],
        },
        undefined,
        abort,
      ),
      evaluationRequest,
    );
  }
  async request(
    ref: string,
    abort: AbortSignal,
  ): Promise<AgentEvaluationRequest> {
    return readData(
      await this.call(
        'get_request_api_v1_business_requests__ref_id__get',
        undefined,
        { ref_id: ref },
        abort,
      ),
      evaluationRequest,
    );
  }
  async evaluate(
    agent: string,
    request: string,
    key: string,
    abort: AbortSignal,
  ): Promise<AgentEvaluation> {
    return readData(
      await this.call(
        'start_agent_evaluation_api_v1_ai_agents__ref_id__evaluations_post',
        { request_ref: request, submit_key: key },
        { ref_id: agent },
        abort,
      ),
      (value) => {
        const row = record(value);
        if (
          row['agent_ref'] !== agent ||
          row['evidence_kind'] !== 'GOVERNED_REQUEST_SUBMISSION'
        ) {
          throw Error('Invalid evaluation receipt');
        }
        return {
          request: text(row, 'request_ref'),
          status: text(row, 'request_status'),
          process: optionalText(row, 'process_ref'),
        };
      },
    );
  }
}
