export type AgentProvider = {
  key: string;
  available: boolean;
  unavailable_reason: string | null;
  supports_tools: boolean;
  supports_structured_output: boolean;
  strict_spend_supported: boolean;
  governed_execution: boolean;
};
export type AgentModel = {
  connection_ref: string;
  provider: string;
  model_id: string;
  source: 'configured';
  can_execute: boolean;
  supports_structured_output: boolean;
  supports_tools: boolean;
  region: string | null;
  provider_retention: string;
};
export type AgentMetadataPort = {
  provider(key: string): Promise<AgentProvider>;
  model(connection: string, model: string): Promise<AgentModel>;
};
