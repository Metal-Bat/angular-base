import { JsonObject } from '../../../shared/domain/json-value';

export type AgentPage<T> = {
  items: readonly T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};
export type NamedAgentResource = { ref: string; name: string; status?: string };
export type AgentChoicePreview = {
  state: 'STATIC' | 'MISSING' | 'EMPTY' | 'INVALID' | 'VALID';
  inputKey: string | null;
  options: readonly {
    key: string;
    labels: Record<string, string>;
    description: string;
  }[];
  issues: readonly string[];
};
export type AgentWorkflowContext = {
  version: string;
  step: string;
  checksum: string | null;
  schema: JsonObject | null;
  origin: 'AUTHOR' | 'CONSTANT_BINDING' | 'NONE';
  decision: AgentChoicePreview;
};
export type AgentReportSource = {
  ref: string;
  name: string;
  createdAt: string;
  version: number;
  classification: string;
  fields: readonly string[];
  maxRows: number;
};
export type AgentLookupPreview = { source: AgentReportSource; limit: number };
export type AgentEvaluationRequest = NamedAgentResource & {
  untitled?: boolean;
  version: string;
  status: string;
  createdAt: string;
};
export type AgentEvaluation = {
  request: string;
  status: string;
  process: string | null;
};
export type AgentAuthoringPort = {
  workflows(
    search: string,
    page: number,
    abort: AbortSignal,
  ): Promise<AgentPage<NamedAgentResource>>;
  versions(
    workflow: string,
    page: number,
    abort: AbortSignal,
  ): Promise<AgentPage<NamedAgentResource>>;
  steps(
    version: string,
    agent: string,
    abort: AbortSignal,
  ): Promise<readonly NamedAgentResource[]>;
  context(
    agent: string,
    version: string,
    step: string,
    sample: JsonObject | null,
    abort: AbortSignal,
  ): Promise<AgentWorkflowContext>;
  decision(
    agent: string,
    sample: JsonObject | null,
    abort: AbortSignal,
  ): Promise<AgentChoicePreview>;
  sources(
    agent: string,
    search: string,
    page: number,
    abort: AbortSignal,
  ): Promise<AgentPage<AgentReportSource>>;
  lookup(
    agent: string,
    report: string,
    limit: number,
    abort: AbortSignal,
  ): Promise<AgentLookupPreview>;
  requests(
    page: number,
    abort: AbortSignal,
  ): Promise<AgentPage<AgentEvaluationRequest>>;
  request(ref: string, abort: AbortSignal): Promise<AgentEvaluationRequest>;
  evaluate(
    agent: string,
    request: string,
    key: string,
    abort: AbortSignal,
  ): Promise<AgentEvaluation>;
};
