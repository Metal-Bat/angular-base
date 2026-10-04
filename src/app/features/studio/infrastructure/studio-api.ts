import { readWorkspace } from '../domain/workspace-document';
import { OptionInput, OptionPage } from '../../forms/domain/option-coordinator';
import { readOptionPreview } from './option-preview';
import { inject, Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
import {
  JsonObject,
  RuntimeCompatibility,
} from '../../forms/domain/runtime-document';
import { readRuntimeDocument } from '../../forms/infrastructure/runtime-document-adapter';
import { RUNTIME_CONFIG } from '../../../core/configuration/runtime-config';
import { AuthorPage, StudioPort } from '../application/studio-port';
import {
  projectFields,
  ResourceKey,
  ResourceSpec,
  Workspace,
  WorkspaceState,
} from '../domain/authoring';
import {
  fieldSpecs,
  operation,
  specifications,
} from './resource-specifications';
const tools = {
  workspaceHistory:
    'workspace_history_api_v1_workflow_versions__ref_id__workspace_history_post',
  validate: 'validate_form_api_v1_forms_validate_post',
  behavior: 'preview_behavior_api_v1_forms_behavior_preview_post',
  navigation: 'preview_navigation_api_v1_forms_navigation_preview_post',
  options: 'preview_options_api_v1_forms_options_post',
  schema: 'render_meta_schema_api_v1_forms_render_schema_post',
  fields: 'get_field_catalog_api_v1_forms_field_catalog_post',
  graph: 'validate_graph_api_v1_workflows_validate_post',
  catalog: 'catalog_api_v1_designer_catalog_post',
  selectors: 'selector_api_v1_designer_selectors__kind__post',
  completion: 'completion_api_v1_designer_completion_post',
  inventory: 'field_inventory_api_v1_designer_field_inventory_post',
  library: 'search_library_api_v1_designer_library_search_post',
  selection: 'select_library_api_v1_designer_library_select_post',
  dependencies:
    'dependencies_api_v1_designer_library__kind___ref_id__dependencies_post',
  usage: 'where_used_api_v1_designer_library__kind___ref_id__where_used_post',
  compare: 'compare_api_v1_designer_library__kind___ref_id__compare_post',
  guidance: 'guidance_api_v1_designer_library__kind___ref_id__guidance_post',
  template: 'create_template_api_v1_designer_library_templates_post',
  explanation:
    'explanation_api_v1_designer_library_form_versions__ref_id__explanation_post',
  upgradePreview:
    'upgrade_preview_api_v1_designer_library_upgrade_preview_post',
  upgradeApply: 'upgrade_apply_api_v1_designer_library_upgrade_apply_post',
} satisfies Record<string, ApiOperationId>;
@Injectable({ providedIn: 'root' })
export class StudioApi implements StudioPort {
  private readonly api = inject(ApiClient);
  private readonly config = inject(RUNTIME_CONFIG);
  spec(key: ResourceKey): ResourceSpec {
    const contract = specifications[key];
    if (!contract) {
      throw Error('Unknown catalog');
    }
    return {
      key,
      title: contract.title,
      permission: contract.permission,
      editor: contract.editor,
      fields: fieldSpecs(contract, 'update'),
      createFields: fieldSpecs(contract, 'create'),
      queryFields: fieldSpecs(contract, 'search').filter(
        (field) => field.required,
      ),
      actions: Object.keys(contract.operations),
    };
  }
  private async request(
    id: ApiOperationId,
    body?: JsonObject,
    path?: Record<string, string>,
    abort?: AbortSignal,
  ): Promise<HttpResponse<unknown>> {
    return firstValueFrom(
      this.api.call(
        id,
        {
          ...(body === undefined ? {} : { body }),
          ...(path ? { path } : {}),
        } as RequestInput<typeof id>,
        abort,
      ),
    );
  }
  async search(
    key: ResourceKey,
    page: number,
    query: JsonObject,
    report = false,
  ): Promise<AuthorPage> {
    return readResultPage(
      await this.request(
        operation(specifications[key].operations[report ? 'report' : 'search']),
        { page, size: 20, filters: [], sort_orders: [], ...query },
      ),
      (value) => record(value) as JsonObject,
    );
  }
  async get(key: ResourceKey, reference: string): Promise<JsonObject> {
    return readData(
      await this.request(
        operation(specifications[key].operations['get']),
        undefined,
        { ref_id: reference },
      ),
      (value) => record(value) as JsonObject,
    );
  }
  async write(
    key: ResourceKey,
    reference: string | null,
    body: JsonObject,
  ): Promise<JsonObject> {
    const fields = reference
      ? this.spec(key).fields
      : this.spec(key).createFields;
    return this.decode(
      await this.request(
        operation(
          specifications[key].operations[reference ? 'update' : 'create'],
        ),
        projectFields(fields, body),
        reference ? { ref_id: reference } : undefined,
      ),
    );
  }
  private decode(
    response: import('@angular/common/http').HttpResponse<unknown>,
  ): JsonObject {
    return readData(response, (value) =>
      value === null ? {} : (record(value) as JsonObject),
    );
  }
  async action(
    key: ResourceKey,
    reference: string,
    action: string,
    body?: JsonObject,
    target?: string,
  ): Promise<JsonObject> {
    const response = await this.request(
      operation(specifications[key].operations[action]),
      body,
      { ref_id: reference, ...(target ? { grant_ref_id: target } : {}) },
    );
    if (action === 'grants') {
      const page = readResultPage(
        response,
        (value) => record(value) as JsonObject,
      );
      return {
        items: page.items,
        page: page.page,
        total_pages: page.totalPages,
      };
    }
    return this.decode(response);
  }
  async history(
    key: ResourceKey,
    reference: string,
    page: number,
  ): Promise<AuthorPage> {
    return readResultPage(
      await this.request(
        operation(specifications[key].operations['history']),
        { page, size: 20, filters: [], sort_orders: [] },
        { ref_id: reference },
      ),
      (value) => record(value) as JsonObject,
    );
  }
  async auxiliary(
    key: string,
    body: JsonObject | undefined,
    path?: Record<string, string>,
  ): Promise<unknown> {
    if (!(key in tools)) {
      throw Error('Unknown designer operation');
    }
    const response = await this.request(
      tools[key as keyof typeof tools],
      body,
      path,
    );
    if (Array.isArray(response.body)) {
      return response.body;
    }
    const envelope = record(response.body);
    return 'result' in envelope
      ? readResultPage(response, (value) => record(value))
      : readData(response, (value) => value);
  }
  private workspaceState(value: unknown): WorkspaceState {
    const raw = record(value);
    return {
      reference:
        typeof raw['workspace_ref_id'] === 'string'
          ? raw['workspace_ref_id']
          : null,
      version: String(raw['workflow_version_ref_id']),
      document: readWorkspace(raw['document']),
      promoted:
        typeof raw['promoted_graph_checksum'] === 'string'
          ? raw['promoted_graph_checksum']
          : null,
    };
  }
  async workspace(version: string): Promise<WorkspaceState> {
    return readData(
      await this.request(
        'get_workspace_api_v1_workflow_versions__ref_id__workspace_get',
        undefined,
        { ref_id: version },
      ),
      (value) => this.workspaceState(value),
    );
  }
  async saveWorkspace(
    state: WorkspaceState,
    document: Workspace,
  ): Promise<WorkspaceState> {
    return readData(
      await this.request(
        'save_workspace_api_v1_workflow_versions__ref_id__workspace_put',
        {
          workspace_ref_id: state.reference,
          document: document as unknown as JsonObject,
        },
        { ref_id: state.version },
      ),
      (value) => this.workspaceState(value),
    );
  }
  async promote(state: WorkspaceState): Promise<JsonObject> {
    if (!state.reference) {
      throw Error('Save the workspace first');
    }
    return this.decode(
      await this.request(
        'promote_workspace_api_v1_workflow_versions__ref_id__workspace_promote_post',
        { workspace_ref_id: state.reference },
        { ref_id: state.version },
      ),
    );
  }
  async options(
    documents: JsonObject,
    pointer: string,
    input: OptionInput,
    generation: number,
    signal: AbortSignal,
  ): Promise<OptionPage> {
    const page = await this.optionPage(
      documents,
      pointer,
      input,
      generation,
      signal,
      [],
    );
    if (!input.selected.length || !['READY', 'EMPTY'].includes(page.state)) {
      return page;
    }
    const selected = await this.optionPage(
      documents,
      pointer,
      { ...input, page: 1, search: '' },
      generation,
      signal,
      input.selected,
    );
    if (
      selected.revision !== page.revision ||
      selected.fingerprint !== page.fingerprint ||
      selected.locale !== page.locale
    ) {
      throw Error('Option preview changed');
    }
    return {
      ...page,
      items: [
        ...new Map(
          [...page.items, ...selected.items].map((item) => [item.key, item]),
        ).values(),
      ],
    };
  }
  private async optionPage(
    documents: JsonObject,
    pointer: string,
    input: OptionInput,
    generation: number,
    signal: AbortSignal,
    selected: readonly string[],
  ): Promise<OptionPage> {
    if (signal.aborted) {
      throw Error('Preview cancelled');
    }
    const response = await this.request(
      'preview_options_api_v1_forms_options_post',
      {
        documents,
        locale: input.locale,
        query: {
          node_pointer: pointer,
          data: input.data,
          page: input.page,
          size: selected.length ? 100 : 20,
          search: input.search || null,
          selected_keys: [...selected],
          generation,
          row_indices: [...(input.indices ?? [])],
        },
      },
      undefined,
      signal,
    );
    if (signal.aborted) {
      throw Error('Preview cancelled');
    }
    return readOptionPreview(response, generation);
  }
  async preview(
    documents: JsonObject,
    data: JsonObject,
    purpose: string,
    locale: string,
    context: JsonObject = {},
  ): Promise<RuntimeCompatibility> {
    return readData(
      await this.request(
        'simulated_runtime_preview_api_v1_forms_runtime_preview_post',
        {
          documents,
          data,
          purpose,
          locale,
          ...projectFields(
            [
              'policy',
              'before_data',
              'item_identity',
              'before_item_identity',
            ].map((key) => ({
              key,
              title: key,
              type: 'json',
              required: false,
              nullable: true,
              options: [],
              initial: undefined,
              schema: {},
            })),
            context,
          ),
        },
      ),
      (value) =>
        readRuntimeDocument(value, undefined, this.config.rendererCapabilities),
    );
  }
}
