import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ActorState } from '../auth/actor-state';
import { ApiClient } from '../transport/api-client';
import { NotificationPreview } from './notification-preview';

describe('Actor-owned notification preview', () => {
  let response: Subject<HttpResponse<unknown>>;
  beforeEach(() => {
    response = new Subject();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiClient,
          useValue: { call: (): Subject<HttpResponse<unknown>> => response },
        },
      ],
    });
  });
  function page(items: unknown[], total = items.length): void {
    response.next(
      new HttpResponse({
        body: {
          success: true,
          result: {
            items,
            page: 1,
            size: 20,
            total,
            total_pages: total ? Math.ceil(total / 20) : 0,
          },
        },
      }),
    );
  }
  it('loads only projected notification subjects and supports a genuine empty page', async () => {
    const preview = TestBed.inject(NotificationPreview);
    let work = preview.load();
    expect(preview.status()).toBe('loading');
    page([
      {
        ref_id: 'opaque/notification',
        subject: 'Review requested',
        private_body: 'omit',
      },
    ]);
    await work;
    expect(preview.items()).toEqual([
      { ref: 'opaque/notification', subject: 'Review requested' },
    ]);
    response = new Subject();
    work = preview.load();
    page([]);
    await work;
    expect(preview.items()).toEqual([]);
    expect(preview.status()).toBe('ready');
  });
  it('uses the authoritative unread total rather than the current page length', async () => {
    const preview = TestBed.inject(NotificationPreview);
    const work = preview.load();
    page([{ ref_id: 'current', subject: 'One page item' }], 31);
    await work;
    expect(preview.unreadCount()).toBe(31);
    expect(preview.totalPages()).toBe(2);
    TestBed.inject(ActorState).reset();
    expect(preview.unreadCount()).toBeNull();
  });
  it('ignores a previous actor response after cleanup', async () => {
    const preview = TestBed.inject(NotificationPreview);
    const work = preview.load();
    TestBed.inject(ActorState).reset();
    page([{ ref_id: 'old', subject: 'Previous actor' }]);
    await work;
    expect(preview.status()).toBe('idle');
    expect(preview.items()).toEqual([]);
  });
  it('shows failure without exposing malformed private response content', async () => {
    const preview = TestBed.inject(NotificationPreview);
    const work = preview.load();
    page([{ private_body: 'undisclosed' }]);
    await work;
    expect(preview.status()).toBe('error');
    expect(preview.items()).toEqual([]);
  });
});
