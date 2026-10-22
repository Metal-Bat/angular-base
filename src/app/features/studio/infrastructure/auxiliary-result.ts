import { HttpResponse } from '@angular/common/http';
import { record } from '../../../core/transport/api-failure';
import {
  readData,
  readResultPage,
} from '../../../core/transport/response-adapters';
import { JsonObject } from '../../forms/domain/runtime-document';
import { operationCatalog } from './operation-catalog';
import { readOptionPreview } from './option-preview';

/** Preserve each existing auxiliary envelope; option previews also retain their state and revision. */
export function readAuxiliary(
  key: string,
  response: HttpResponse<unknown>,
  body: JsonObject | undefined,
): unknown {
  if (key === 'operations') {
    return readData(response, operationCatalog);
  }
  if (key === 'options') {
    const query = body?.['query'] as JsonObject | undefined;
    return readOptionPreview(response, Number(query?.['generation'] ?? 0));
  }
  if (Array.isArray(response.body)) {
    return response.body;
  }
  const envelope = record(response.body);
  return 'result' in envelope
    ? readResultPage(response, (value) => record(value))
    : readData(response, (value) => value);
}
