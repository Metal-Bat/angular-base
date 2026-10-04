import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import { readData } from '../../../core/transport/response-adapters';
import { RUNTIME_CONFIG } from '../../../core/configuration/runtime-config';
import { RuntimeCompatibility } from '../domain/runtime-document';
import { RuntimeDocumentReader } from '../application/runtime-document-reader';
import { readRuntimeDocument, RuntimePin } from './runtime-document-adapter';
@Injectable({ providedIn: 'root' })
export class RuntimeReader implements RuntimeDocumentReader {
  private readonly api = inject(ApiClient);
  private readonly capabilities = inject(RUNTIME_CONFIG).rendererCapabilities;
  async task(
    reference: string,
    key: string,
    pin?: RuntimePin,
  ): Promise<RuntimeCompatibility> {
    const response = await firstValueFrom(
      this.api.call(
        'get_work_item_runtime_api_v1_work_items__ref_id__runtime_get',
        { path: { ref_id: reference }, query: { key } },
      ),
    );
    return readData(response, (value) =>
      readRuntimeDocument(value, pin, this.capabilities),
    );
  }
  async request(
    reference: string,
    pin?: RuntimePin,
  ): Promise<RuntimeCompatibility> {
    const response = await firstValueFrom(
      this.api.call(
        'get_request_runtime_api_v1_business_requests__ref_id__view_get',
        { path: { ref_id: reference } },
      ),
    );
    return readData(response, (value) =>
      readRuntimeDocument(value, pin, this.capabilities),
    );
  }
}
