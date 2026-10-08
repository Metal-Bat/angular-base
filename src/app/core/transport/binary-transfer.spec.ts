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
  beforeEach(async () => {
    await import('./generated/operations');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BinaryTransfer,
      ],
    });
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
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
});
