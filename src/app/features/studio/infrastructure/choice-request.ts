import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import { record } from '../../../core/transport/api-failure';
import { readResultPage } from '../../../core/transport/response-adapters';
import { AuthorPage } from '../application/studio-port';
import {
  ApiOperationId,
  RequestInput,
} from '../../../core/transport/api-types';
import { JsonObject } from '../../forms/domain/runtime-document';
const selectors = new Set([
  'users',
  'work_groups',
  'forms',
  'form_versions',
  'workflows',
  'workflow_versions',
  'request_types',
  'definition_status',
  'request_status',
  'process_status',
  'outcome',
]);
const operations: Readonly<Record<string, ApiOperationId>> = {
  clients: 'select_clients_api_v1_clients_select_post',
  client_releases: 'select_releases_api_v1_client_releases_select_post',
  connections: 'select_connections_api_v1_integration_connections_select_post',
  agent_versions: 'select_agents_api_v1_ai_agents_select_post',
  step_versions: 'select_step_types_api_v1_step_types_select_post',
  components: 'search_api_v1_form_components_search_post',
  data_types: 'search_api_v1_form_data_types_search_post',
};
export function choiceRequest(
  kind: string,
  body: JsonObject,
  context: JsonObject,
  locale: string,
): {
  id: ApiOperationId;
  input: {
    body: JsonObject;
    path?: Record<string, string>;
    query: Record<string, string>;
  };
  roots: boolean;
} {
  const query: Record<string, string> = { response_format: 'page' };
  if (selectors.has(kind)) {
    return {
      id: 'selector_api_v1_designer_selectors__kind__post',
      input: { body, path: { kind }, query },
      roots: false,
    };
  }
  if (kind === 'component_versions' || kind === 'data_type_versions') {
    return {
      id: 'select_library_api_v1_designer_library_select_post',
      input: {
        body: {
          ...body,
          kind: kind === 'component_versions' ? 'component' : 'data_type',
          locale: locale === 'fa' ? 'fa' : 'en',
        },
        query,
      },
      roots: false,
    };
  }
  const id = operations[kind];
  if (!id) {
    throw Error('Approved selector unavailable; existing pin is preserved.');
  }
  if (kind === 'client_releases') {
    if (
      typeof context['client_ref_id'] !== 'string' ||
      !context['client_ref_id']
    ) {
      throw Error('Choose a client first.');
    }
    query['client_ref_id'] = context['client_ref_id'];
  }
  if (kind === 'connections') {
    if (!['SERVICE', 'NOTIFICATION'].includes(String(context['kind']))) {
      throw Error('Choose a connection kind first.');
    }
    query['kind'] = String(context['kind']);
  }
  const roots = kind === 'components' || kind === 'data_types';
  return {
    id,
    input: {
      query,
      body: roots
        ? {
            page: body['page'],
            size: body['size'],
            sort_orders: [],
            filters: [
              { field_name: 'is_active', operation: 'equal', value: true },
              ...(body['search']
                ? [
                    {
                      field_name: 'name',
                      operation: 'contains',
                      value: body['search'],
                    },
                  ]
                : []),
            ],
          }
        : body,
    },
    roots,
  };
}

export async function loadChoices(
  api: ApiClient,
  kind: string,
  body: JsonObject,
  context: JsonObject,
  abort?: AbortSignal,
): Promise<AuthorPage> {
  const request = choiceRequest(
    kind,
    body,
    context,
    String(context['locale'] ?? 'en'),
  );
  return readResultPage(
    await firstValueFrom(
      api.call(
        request.id,
        request.input as RequestInput<ApiOperationId>,
        abort,
      ),
    ),
    (value) => {
      const row = record(value) as JsonObject;
      return request.roots ? { key: row['ref_id'], value: row['name'] } : row;
    },
  );
}
