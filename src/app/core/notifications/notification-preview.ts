import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ActorState } from '../auth/actor-state';
import { ApiClient } from '../transport/api-client';
import { record } from '../transport/api-failure';
import { readResultPage } from '../transport/response-adapters';
@Injectable({ providedIn: 'root' })
export class NotificationPreview {
  private readonly actor = inject(ActorState);
  private readonly api = inject(ApiClient);
  private generation = 0;
  readonly status = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly items = signal<readonly { ref: string; subject: string }[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  constructor() {
    this.actor.register((): void => {
      this.generation++;
      this.status.set('idle');
      this.items.set([]);
      this.page.set(1);
      this.totalPages.set(0);
    });
  }
  async load(index = 1): Promise<void> {
    const epoch = this.actor.epoch;
    const generation = ++this.generation;
    this.status.set('loading');
    this.items.set([]);
    try {
      const response = await firstValueFrom(
        this.api.call('search_notifications_api_v1_notifications_search_post', {
          body: { page: index, size: 20 },
        }),
      );
      const page = readResultPage(
        response,
        (value): { ref: string; subject: string } => {
          const item = record(value);
          if (
            typeof item['ref_id'] !== 'string' ||
            typeof item['subject'] !== 'string'
          ) {
            throw new Error('Invalid notification response.');
          }
          return { ref: item['ref_id'], subject: item['subject'] };
        },
      );
      if (this.actor.epoch !== epoch || generation !== this.generation) {
        return;
      }
      this.page.set(page.page);
      this.totalPages.set(page.totalPages);
      this.items.set(page.items);
      this.status.set('ready');
    } catch {
      if (this.actor.epoch === epoch && generation === this.generation) {
        this.status.set('error');
      }
    }
  }
}
