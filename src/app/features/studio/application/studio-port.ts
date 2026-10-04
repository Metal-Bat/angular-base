import { OptionInput, OptionPage } from '../../forms/domain/option-coordinator';
import {
  JsonObject,
  RuntimeCompatibility,
} from '../../forms/domain/runtime-document';
import {
  ResourceKey,
  ResourceSpec,
  Workspace,
  WorkspaceState,
} from '../domain/authoring';
export type AuthorPage = {
  items: readonly JsonObject[];
  page: number;
  totalPages: number;
};
export type StudioPort = {
  spec(key: ResourceKey): ResourceSpec;
  search(
    key: ResourceKey,
    page: number,
    query: JsonObject,
    report?: boolean,
  ): Promise<AuthorPage>;
  get(key: ResourceKey, reference: string): Promise<JsonObject>;
  write(
    key: ResourceKey,
    reference: string | null,
    body: JsonObject,
  ): Promise<JsonObject>;
  action(
    key: ResourceKey,
    reference: string,
    action: string,
    body?: JsonObject,
    target?: string,
  ): Promise<JsonObject>;
  history(
    key: ResourceKey,
    reference: string,
    page: number,
  ): Promise<AuthorPage>;
  auxiliary(
    key: string,
    body: JsonObject | undefined,
    path?: Record<string, string>,
  ): Promise<unknown>;
  workspace(version: string): Promise<WorkspaceState>;
  saveWorkspace(
    state: WorkspaceState,
    document: Workspace,
  ): Promise<WorkspaceState>;
  promote(state: WorkspaceState): Promise<JsonObject>;
  options(
    documents: JsonObject,
    pointer: string,
    input: OptionInput,
    generation: number,
    signal: AbortSignal,
  ): Promise<OptionPage>;
  preview(
    documents: JsonObject,
    data: JsonObject,
    purpose: string,
    locale: string,
    context?: JsonObject,
  ): Promise<RuntimeCompatibility>;
};
