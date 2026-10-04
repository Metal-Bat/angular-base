import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { SuccessBody } from './api-types';

@Injectable({ providedIn: 'root' })
export class HealthClient {
  private readonly http = inject(HttpClient);
  liveness(): Observable<HttpResponse<SuccessBody<'liveness_health_get'>>> {
    return this.http.get<SuccessBody<'liveness_health_get'>>('/health', {
      observe: 'response',
    });
  }
  readiness(): Observable<HttpResponse<SuccessBody<'ready_ready_get'>>> {
    return this.http.get<SuccessBody<'ready_ready_get'>>('/ready', {
      observe: 'response',
    });
  }
}
