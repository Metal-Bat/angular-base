import { JsonObject } from '../../forms/domain/runtime-document';
const object = (value: unknown): value is JsonObject =>
  !!value && typeof value === 'object' && !Array.isArray(value);
/** Workspace JSON can predate executable graph validation. Never normalize malformed saved fields away. */
export function interfaceDocument(value: unknown): value is JsonObject {
  if (!object(value)) {
    return false;
  }
  if (
    value['category'] !== undefined &&
    typeof value['category'] !== 'string'
  ) {
    return false;
  }
  if (
    value['outcomes'] !== undefined &&
    (!object(value['outcomes']) ||
      Object.values(value['outcomes']).some((item) => typeof item !== 'string'))
  ) {
    return false;
  }
  return ['inputs', 'outputs'].every((kind) => {
    const rows = value[kind];
    return (
      rows === undefined ||
      (Array.isArray(rows) &&
        rows.every((row) => {
          if (
            !object(row) ||
            typeof row['name'] !== 'string' ||
            !object(row['value_schema'])
          ) {
            return false;
          }
          if (kind === 'outputs') {
            return (
              typeof row['source_step'] === 'string' &&
              typeof row['source_port'] === 'string'
            );
          }
          return (
            (row['required'] === undefined ||
              typeof row['required'] === 'boolean') &&
            (row['assignment'] === undefined ||
              row['assignment'] === null ||
              ['user', 'work_group'].includes(String(row['assignment'])))
          );
        }))
    );
  });
}
export function interfaceDraft(value: unknown): JsonObject | null {
  return interfaceDocument(value) ? structuredClone(value) : null;
}
