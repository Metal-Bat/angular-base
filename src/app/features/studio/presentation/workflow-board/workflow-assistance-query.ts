import { JsonObject } from '../../../forms/domain/runtime-document';
/** Exact existing operation-specific assistance payloads. */
export function workflowAssistanceQuery(
  tool: string,
  page: number,
  context: {
    reference: string;
    selectorSearch: string;
    startForm: string;
    requestType: string;
    selected: string;
  },
): JsonObject {
  return tool === 'workspaceHistory'
    ? { page, size: 20 }
    : tool === 'selectors'
      ? {
          page,
          size: 20,
          ...(context.selectorSearch ? { search: context.selectorSearch } : {}),
        }
      : tool === 'inventory'
        ? {
            workflow_version_ref_id: context.reference,
            ...(context.startForm
              ? { start_form_version_ref_id: context.startForm }
              : {}),
            page,
            size: 20,
          }
        : {
            workflow_version_ref_id: context.reference,
            request_type_ref_id: context.requestType,
            current_step_key: context.selected,
            page,
            size: 20,
          };
}
