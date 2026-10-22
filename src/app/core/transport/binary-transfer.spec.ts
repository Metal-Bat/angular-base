import {
  HttpEventType,
  HttpResponse,
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActorState } from '../auth/actor-state';
import {
  BinaryTransfer,
  responseFilename,
  safeFilename,
} from './binary-transfer';
import { ApiFailure } from './api-failure';
describe('Private binary transfers', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await import('./generated/operations');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BinaryTransfer,
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('sanitizes traversal, controls and encoded filenames', () => {
    expect(safeFilename('../a\\b\u0000.pdf')).not.toContain('/');
    expect(safeFilename('\u202e.exe')).not.toContain('\u202e');
    expect(
      responseFilename("attachment; filename*=UTF-8''report%20name.zip"),
    ).toBe('report name.zip');
    expect(
      responseFilename(
        'attachment; filename*=UTF-8\'\'%xx; filename="fallback.txt"',
      ),
    ).toBe('fallback.txt');
  });
  it('reports download progress and returns bytes without parsing JSON file content', async () => {
    const transfer = TestBed.inject(BinaryTransfer);
    const pending = transfer.run(
      'download_file_api_v1_media_files__ref_id__get',
      { path: { ref_id: 'owned' } },
    );
    const request = await vi.waitFor(() =>
      TestBed.inject(HttpTestingController).expectOne(
        '/api/v1/media/files/owned',
      ),
    );
    expect(request.request.reportProgress).toBe(true);
    expect(request.request.responseType).toBe('blob');
    request.event({
      type: HttpEventType.DownloadProgress,
      loaded: 20,
      total: 40,
    });
    expect(transfer.progress()).toBe(50);
    const body = new Blob(['{"file":true}'], { type: 'application/json' });
    request.flush(body);
    expect((await pending).body).toBe(body);
    expect(transfer.busy()).toBe(false);
  });
  it('cancels the underlying request on actor loss and rejects its waiting promise', async () => {
    const transfer = TestBed.inject(BinaryTransfer);
    const pending = transfer
      .run('download_report_api_v1_reports__ref_id__download_get', {
        path: { ref_id: 'owned' },
      })
      .catch((error: unknown) => error);
    const request = await vi.waitFor(() =>
      TestBed.inject(HttpTestingController).expectOne(
        '/api/v1/reports/owned/download',
      ),
    );
    TestBed.inject(ActorState).reset();
    expect(request.cancelled).toBe(true);
    expect(await pending).toBeInstanceOf(Error);
    expect(transfer.busy()).toBe(false);
  });
  it('revokes downloaded object URLs on actor loss and only once when the timer fires', () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL = vi.fn(() => 'blob:owned');
        static override revokeObjectURL = vi.fn();
      },
    );
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    try {
      const transfer = TestBed.inject(BinaryTransfer);
      transfer.download(new HttpResponse({ body: new Blob(['private']) }));
      expect(URL.createObjectURL).toHaveBeenCalledOnce();
      TestBed.inject(ActorState).reset();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:owned');
      vi.runAllTimers();
      expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
    } finally {
      click.mockRestore();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });
  it('decodes denied JSON responses without creating a download', async () => {
    const transfer = TestBed.inject(BinaryTransfer);
    const pending = transfer
      .run('download_file_api_v1_media_files__ref_id__get', {
        path: { ref_id: 'denied' },
      })
      .catch((error: unknown) => error);
    const request = await vi.waitFor(() =>
      TestBed.inject(HttpTestingController).expectOne(
        '/api/v1/media/files/denied',
      ),
    );
    request.flush(new Blob(['{"success":false,"code":404}']), {
      status: 404,
      statusText: 'Not Found',
    });
    expect(await pending).toBeInstanceOf(ApiFailure);
    expect(transfer.busy()).toBe(false);
  });
  it('keeps error-body decoding cancellable and fences late completion from a new transfer', async () => {
    const transfer = TestBed.inject(BinaryTransfer);
    const pending = transfer
      .run('download_file_api_v1_media_files__ref_id__get', {
        path: { ref_id: 'old' },
      })
      .catch((error: unknown) => error);
    const request = await vi.waitFor(() =>
      TestBed.inject(HttpTestingController).expectOne(
        '/api/v1/media/files/old',
      ),
    );
    let decode!: (value: string) => void;
    const body = new Blob(['private error']);
    vi.spyOn(body, 'text').mockReturnValue(
      new Promise((resolve) => {
        decode = resolve;
      }),
    );
    request.flush(body, { status: 403, statusText: 'Forbidden' });
    expect(transfer.busy()).toBe(true);
    await expect(
      transfer.run('download_file_api_v1_media_files__ref_id__get', {
        path: { ref_id: 'blocked' },
      }),
    ).rejects.toThrow('already running');
    TestBed.inject(ActorState).reset();
    expect(await pending).toEqual(Error('Transfer cancelled'));
    const next = transfer.run('download_file_api_v1_media_files__ref_id__get', {
      path: { ref_id: 'new' },
    });
    const current = await vi.waitFor(() =>
      TestBed.inject(HttpTestingController).expectOne(
        '/api/v1/media/files/new',
      ),
    );
    decode('{"success":false,"code":403}');
    await Promise.resolve();
    expect(transfer.busy()).toBe(true);
    expect(transfer.progress()).toBeNull();
    const bytes = new Blob(['new account file']);
    current.flush(bytes);
    expect((await next).body).toBe(bytes);
    expect(transfer.busy()).toBe(false);
  });
  it('cancels an error body still being consumed when its owner is destroyed', async () => {
    const transfer = TestBed.inject(BinaryTransfer);
    const pending = transfer
      .run('download_file_api_v1_media_files__ref_id__get', {
        path: { ref_id: 'owned' },
      })
      .catch((error: unknown) => error);
    const request = await vi.waitFor(() =>
      TestBed.inject(HttpTestingController).expectOne(
        '/api/v1/media/files/owned',
      ),
    );
    let decode!: (value: string) => void;
    const body = new Blob(['private']);
    vi.spyOn(body, 'text').mockReturnValue(
      new Promise((resolve) => {
        decode = resolve;
      }),
    );
    request.flush(body, { status: 403, statusText: 'Forbidden' });
    TestBed.resetTestingModule();
    expect(await pending).toEqual(Error('Transfer cancelled'));
    decode('{}');
    await Promise.resolve();
    expect(transfer.busy()).toBe(false);
  });
  it('does not dispatch a byte request for an already-cancelled owner', async () => {
    const controller = new AbortController();
    controller.abort();
    const transfer = TestBed.inject(BinaryTransfer);
    await expect(
      transfer.run(
        'download_file_api_v1_media_files__ref_id__get',
        {
          path: { ref_id: 'never-sent' },
        },
        controller.signal,
      ),
    ).rejects.toThrow('cancelled');
    expect(transfer.busy()).toBe(false);
    http.expectNone('/api/v1/media/files/never-sent');
  });
  it('cancels only the owning byte request and ignores a completed owner abort', async () => {
    const transfer = TestBed.inject(BinaryTransfer);
    const oldOwner = new AbortController();
    const old = transfer.run(
      'download_file_api_v1_media_files__ref_id__get',
      {
        path: { ref_id: 'old-owner' },
      },
      oldOwner.signal,
    );
    const oldRequest = await vi.waitFor(() =>
      http.expectOne('/api/v1/media/files/old-owner'),
    );
    oldRequest.flush(new Blob(['old']));
    await old;
    const currentOwner = new AbortController();
    const current = transfer
      .run(
        'download_file_api_v1_media_files__ref_id__get',
        {
          path: { ref_id: 'current-owner' },
        },
        currentOwner.signal,
      )
      .catch((error: unknown) => error);
    const currentRequest = await vi.waitFor(() =>
      http.expectOne('/api/v1/media/files/current-owner'),
    );
    oldOwner.abort();
    expect(transfer.busy()).toBe(true);
    expect(currentRequest.cancelled).toBe(false);
    currentOwner.abort();
    expect(await current).toEqual(Error('Transfer cancelled'));
    expect(currentRequest.cancelled).toBe(true);
    expect(transfer.busy()).toBe(false);
  });
});
