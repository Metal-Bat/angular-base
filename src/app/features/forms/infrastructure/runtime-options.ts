import { inject, Injectable } from '@angular/core';
import { firstValueFrom, fromEvent, takeUntil } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import { readResultPage } from '../../../core/transport/response-adapters';
import { record } from '../../../core/transport/api-failure';
import { RuntimeDocument } from '../domain/runtime-document';
import { OptionInput, OptionPage } from '../domain/option-coordinator';
import { decodeChoice } from '../domain/canonical-values';
@Injectable({ providedIn: 'root' })
export class RuntimeOptions {
  private readonly api = inject(ApiClient);
  async query(
    document: RuntimeDocument,
    pointer: string,
    input: OptionInput,
    generation: number,
    signal: AbortSignal,
  ): Promise<OptionPage> {
    const page = await this.readPage(
      document,
      pointer,
      input,
      generation,
      signal,
      [],
    );
    if (!input.selected.length || !['READY', 'EMPTY'].includes(page.state)) {
      return page;
    }
    const selected = await this.readPage(
      document,
      pointer,
      { ...input, page: 1, search: '' },
      generation,
      signal,
      input.selected,
    );
    if (
      selected.revision !== page.revision ||
      selected.fingerprint !== page.fingerprint ||
      selected.generation !== generation ||
      selected.locale !== page.locale
    ) {
      throw new Error('Option snapshot changed.');
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
  private async readPage(
    document: RuntimeDocument,
    pointer: string,
    input: OptionInput,
    generation: number,
    signal: AbortSignal,
    selected: readonly string[],
  ): Promise<OptionPage> {
    const body = {
      node_pointer: pointer,
      data: input.data,
      page: input.page,
      size: selected.length ? 100 : 20,
      search: input.search || null,
      selected_keys: [...selected],
      generation,
      row_indices: [...(input.indices ?? [])],
    };
    if (signal.aborted) {
      throw new Error('Option query cancelled.');
    }
    const response = await firstValueFrom(
      (document.identity.resourceKind === 'REQUEST'
        ? this.api.call(
            'request_options_api_v1_business_requests__ref_id__options_post',
            {
              path: { ref_id: document.identity.resource },
              body,
            },
          )
        : this.api.call(
            'work_item_options_api_v1_work_items__ref_id__options_post',
            {
              path: { ref_id: document.identity.resource },
              query: { key: document.identity.view },
              body,
            },
          )
      ).pipe(takeUntil(fromEvent(signal, 'abort'))),
    );
    const page = readResultPage(response, (value) => {
      const option = record(value);
      if (
        typeof option['key'] !== 'string' ||
        typeof option['value'] !== 'string'
      ) {
        throw new Error('Invalid option.');
      }
      decodeChoice(option['key']);
      return { key: option['key'], value: option['value'] };
    });
    const result = record(record(response.body)['result']);
    if (
      result['dialect'] !== 'bpms.options/1' ||
      result['key_encoding'] !== 'json-scalar/1' ||
      !['READY', 'EMPTY', 'BLOCKED', 'CLIENT_FETCH'].includes(
        String(result['state']),
      ) ||
      !Number.isSafeInteger(result['generation']) ||
      typeof result['source_revision'] !== 'string' ||
      typeof result['dependency_fingerprint'] !== 'string' ||
      typeof result['locale'] !== 'string'
    ) {
      throw new Error('Invalid options document.');
    }
    return {
      state: result['state'] as OptionPage['state'],
      generation: Number(result['generation']),
      revision: result['source_revision'],
      fingerprint: result['dependency_fingerprint'],
      locale: result['locale'],
      items: page.items,
      page: page.page,
      totalPages: page.totalPages,
    };
  }
}
