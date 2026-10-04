import { OptionPage } from '../../forms/domain/option-coordinator';
import { decodeChoice } from '../../forms/domain/canonical-values';
import { record } from '../../../core/transport/api-failure';
import { readResultPage } from '../../../core/transport/response-adapters';
import { HttpResponse } from '@angular/common/http';
export function readOptionPreview(
  response: HttpResponse<unknown>,
  generation: number,
): OptionPage {
  const page = readResultPage(response, (value) => {
    const item = record(value);
    if (typeof item['key'] !== 'string' || typeof item['value'] !== 'string') {
      throw Error('Invalid option');
    }
    decodeChoice(item['key']);
    return { key: item['key'], value: item['value'] };
  });
  const result = record(record(response.body)['result']);
  if (
    result['dialect'] !== 'bpms.options/1' ||
    result['key_encoding'] !== 'json-scalar/1' ||
    result['generation'] !== generation ||
    !['READY', 'EMPTY', 'BLOCKED', 'CLIENT_FETCH'].includes(
      String(result['state']),
    ) ||
    typeof result['source_revision'] !== 'string' ||
    typeof result['dependency_fingerprint'] !== 'string' ||
    typeof result['locale'] !== 'string'
  ) {
    throw Error('Invalid option preview');
  }
  return {
    state: result['state'] as OptionPage['state'],
    generation,
    fingerprint: result['dependency_fingerprint'],
    revision: result['source_revision'],
    locale: result['locale'],
    items: page.items,
    page: page.page,
    totalPages: page.totalPages,
  };
}
