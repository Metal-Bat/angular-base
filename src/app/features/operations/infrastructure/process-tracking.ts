import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import { readData } from '../../../core/transport/response-adapters';
import { ProcessSnapshot } from '../domain/process-tracking';
import { tracking } from './process-decoder';

@Injectable({
  providedIn: 'root',
})
export class ProcessTracking {
  private readonly api = inject(ApiClient);
  async read(
    reference: string,
    page = 1,
    report = false,
    abort?: AbortSignal,
  ): Promise<ProcessSnapshot> {
    const [process, timeline] = await Promise.all([
      firstValueFrom(
        this.api.call(
          'get_process_api_v1_processes__ref_id__get',
          {
            path: { ref_id: reference },
          },
          abort,
        ),
      ),
      firstValueFrom(
        this.api.call(
          report
            ? 'report_process_timeline_api_v1_processes__ref_id__timeline_report_post'
            : 'get_process_timeline_api_v1_processes__ref_id__timeline_post',
          {
            path: { ref_id: reference },
            body: { page, size: 20 },
          },
          abort,
        ),
      ),
    ]);
    return tracking(
      readData(process, (value) => value),
      readData(timeline, (value) => value),
    );
  }
}
