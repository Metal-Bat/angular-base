import { ListQuery } from '../../../shared/domain/list-query';
import { RecordDefinition, RecordPage, RecordRow } from '../domain/records';
export type RecordsPort = {
  list(
    definition: RecordDefinition,
    query: ListQuery,
    path?: Record<string, string>,
    abort?: AbortSignal,
  ): Promise<RecordPage>;
  detail(
    definition: RecordDefinition,
    reference: string,
    abort?: AbortSignal,
  ): Promise<RecordRow>;
  command(
    operation: string,
    body?: RecordRow,
    path?: Record<string, string>,
  ): Promise<RecordRow | null>;
};
