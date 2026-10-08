import { AdminCommand } from './admin-command';
import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
export function referenceCommand(
  key: string,
  commands: readonly AdminCommand[],
  context: JsonObject,
): AdminCommand | undefined {
  const paths: Record<string, string> = {
    user_ref_id: '/api/v1/admin/users/select',
    work_group_ref_id: '/api/v1/admin/work-groups/select',
    connection_ref: '/api/v1/ai-agents/connections/select',
    provider_key: '/api/v1/ai-agents/providers/select',
    model_id: '/api/v1/ai-agents/connections/{connection_ref}/models/select',
    task_name: '/api/v1/tasks/definitions/select',
    queue: '/api/v1/tasks/queues/select',
  };
  if (key === 'model_id' && !context['connection_ref']) {
    return undefined;
  }
  return commands.find((command) => command.path === paths[key]);
}
export function setAt(
  object: JsonObject,
  path: string,
  value: JsonValue,
): JsonObject {
  const [key, ...remaining] = path.split('.');
  if (['__proto__', 'constructor', 'prototype'].includes(key)) {
    throw Error('Invalid field');
  }
  return {
    ...object,
    [key]: remaining.length
      ? setAt((object[key] as JsonObject) ?? {}, remaining.join('.'), value)
      : value,
  };
}
