import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { AdminCommand, AdminInput } from './admin-command';
import { schemaErrors, seedValue } from './schema-form';
export function inputSchema(
  command: AdminCommand,
  location: keyof AdminInput,
  hidden: readonly string[] = [],
): JsonObject {
  const fields = command.fields[location].filter(
    (field) => !hidden.includes(field.key),
  );
  return {
    type: 'object',
    additionalProperties: false,
    properties: Object.fromEntries(
      fields.map((field) => [
        field.key,
        {
          ...field.schema,
          title: field.title,
          ...(field.initial !== undefined ? { default: field.initial } : {}),
          ...(field.nullable
            ? { anyOf: [field.schema, { type: 'null' }] }
            : {}),
        },
      ]),
    ),
    required: fields
      .filter((field) => field.required)
      .map((field) => field.key),
  };
}
export function actionInput(
  command: AdminCommand,
  row: JsonObject,
  base: string,
  selected: JsonObject | null,
): AdminInput {
  const values: AdminInput = { body: {}, path: {}, query: {} };
  for (const location of ['path', 'query', 'body'] as const) {
    for (const field of command.fields[location]) {
      const current = recordContext(row)[field.key];
      if (
        location === 'path' &&
        field.key === 'grant_ref_id' &&
        selected?.['ref_id']
      ) {
        values.path[field.key] = selected!['ref_id'];
      } else if (location === 'path' && current !== undefined) {
        values.path[field.key] = current;
      } else if (inheritQueue(command, location, field.key, current)) {
        values.body[field.key] = current!;
      } else if (location === 'body' && field.key === 'command_key') {
        values.body[field.key] = crypto.randomUUID();
      } else if (
        location === 'body' &&
        field.key === 'task_name' &&
        (row['task_name'] || (base.endsWith('/definitions') && row['name']))
      ) {
        values.body[field.key] = row['task_name'] ?? row['name'];
      } else {
        const initial = seedValue(field.schema);
        if (field.initial !== undefined) {
          values[location][field.key] = structuredClone(field.initial);
        } else if (initial !== undefined) {
          values[location][field.key] = initial;
        }
      }
    }
  }
  return values;
}
export function pageInput(
  command: AdminCommand,
  input: AdminInput,
  page: number | undefined,
  size: number,
): AdminInput {
  const values = structuredClone(input);
  if (page !== undefined) {
    for (const location of ['body', 'query'] as const) {
      if (command.fields[location].some((field) => field.key === 'page')) {
        values[location] = { ...values[location], page, size };
      }
    }
  }
  return values;
}
export function actionErrors(
  command: AdminCommand,
  values: AdminInput,
): Record<string, string> {
  const errors = Object.assign(
    {},
    ...['path', 'query', 'body'].map((location) =>
      schemaErrors(
        inputSchema(command, location as keyof AdminInput),
        values[location as keyof AdminInput],
        location,
      ),
    ),
  );
  if (command.path.endsWith('/grants') && command.method === 'post') {
    if (!!values.body['user_ref_id'] === !!values.body['work_group_ref_id']) {
      errors['body.user_ref_id'] = 'Choose exactly one user or work group.';
      errors['body.work_group_ref_id'] = errors['body.user_ref_id'];
    }
    if (!values.body['can_use'] && !values.body['can_manage']) {
      errors['body.can_use'] = 'Choose at least one capability.';
    }
  }
  return errors;
}

export function actionContext(row: JsonObject, input: AdminInput): JsonObject {
  const body = input.body;
  const nested = Object.values(body).find(
    (value) => value && typeof value === 'object' && !Array.isArray(value),
  ) as JsonObject | undefined;
  return { ...recordContext(row), ...body, ...nested, ...input.path };
}

export function knownTarget(
  key: string,
  row: JsonObject,
  selected: JsonObject | null,
): boolean {
  return (
    (key === 'ref_id' && !!row['ref_id']) ||
    (key === 'task_id' && !!row['task_id']) ||
    (key === 'grant_ref_id' && !!selected?.['ref_id'])
  );
}

function inheritQueue(
  command: AdminCommand,
  location: string,
  key: string,
  current: JsonValue | undefined,
): boolean {
  return (
    location === 'body' &&
    command.path === '/api/v1/tasks/run' &&
    key === 'queue' &&
    current !== undefined
  );
}

function recordContext(row: JsonObject): JsonObject {
  const spec = row['spec'];
  return {
    ...row,
    ...(spec && typeof spec === 'object' && !Array.isArray(spec)
      ? (spec as JsonObject)
      : {}),
  };
}
