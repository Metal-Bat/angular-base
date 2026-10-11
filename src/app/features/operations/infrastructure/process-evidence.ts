import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import { readResultPage } from '../../../core/transport/response-adapters';
import {
  ProcessEvidenceReader,
  ProcessEvidenceSnapshot,
} from '../domain/process-evidence';
import { aiEvidence, orderEvidence } from './process-evidence-decoder';

@Injectable({ providedIn: 'root' })
export class ProcessEvidenceApi implements ProcessEvidenceReader {
  private readonly api = inject(ApiClient);
  async read(
    reference: string,
    ordersPage: number,
    aiPage: number,
    abort: AbortSignal,
  ): Promise<ProcessEvidenceSnapshot> {
    const [orders, ai] = await Promise.all([
      firstValueFrom(
        this.api.call(
          'search_sandbox_orders_api_v1_processes__ref_id__orders_search_post',
          { path: { ref_id: reference }, body: { page: ordersPage, size: 20 } },
          abort,
        ),
      ),
      firstValueFrom(
        this.api.call(
          'search_process_ai_evidence_api_v1_processes__ref_id__ai_evidence_search_post',
          { path: { ref_id: reference }, body: { page: aiPage, size: 20 } },
          abort,
        ),
      ),
    ]);
    return {
      orders: readResultPage(orders, orderEvidence),
      ai: readResultPage(ai, aiEvidence),
    };
  }
}
