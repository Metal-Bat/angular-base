import { ActorState } from '../../../core/auth/actor-state';
import { HttpResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthSession } from '../../../core/auth/auth-session';
import { Feedback } from '../../../core/feedback/feedback';
import { ApiClient } from '../../../core/transport/api-client';
import { BinaryTransfer } from '../../../core/transport/binary-transfer';
import { RuntimeReader } from '../../forms/infrastructure/runtime-reader';
import { readRuntimeDocument } from '../../forms/infrastructure/runtime-document-adapter';
import { runtimeFixture } from '../../forms/testing/runtime-fixtures';
import { CaseRecord } from '../domain/workspace-models';
import { CaseEditor } from './case-editor';
import { CaseResources } from './case-resources';
import { WorkspaceApi } from './workspace-api';

async function setup(kind: 'request' | 'task' = 'request'): Promise<{
  files: CaseResources;
  editor: CaseEditor;
  run: ReturnType<typeof vi.fn>;
  call: ReturnType<typeof vi.fn>;
}> {
  const dto = runtimeFixture(kind === 'task' ? 'WORK_ITEM' : 'REQUEST');
  (dto['data'] as Record<string, unknown>)['amount'] = [];
  dto['render_schema'] = {
    dialect: 'bpms.render/1',
    root: {
      component: 'vertical',
      children: [
        {
          component: 'attachment_collection',
          node_key: 'receipts',
          scope: '/properties/amount',
          label: 'Receipts',
        },
      ],
    },
  };
  const metadata = dto['field_metadata'] as Record<string, unknown>[];
  metadata[0]['validation_schema'] = {
    type: 'array',
    items: { type: 'string' },
  };

  const current: CaseRecord = {
    ref: 'opaque/current',
    status: kind === 'task' ? 'CLAIMED' : 'DRAFT',
    kind: 'HUMAN_TASK',
    claimant: kind === 'task' ? 'actor' : null,
    form: 'opaque/pinned',
    workflow: 'workflow',
    process: null,
    runtime: null,
  };
  const run = vi.fn().mockResolvedValue(
    new HttpResponse({
      body: new Blob([
        JSON.stringify({
          success: true,
          data: { ref_id: 'private-upload' },
        }),
      ]),
    }),
  );
  const call = vi.fn().mockReturnValue(throwError(() => Error('Link failed')));
  TestBed.configureTestingModule({
    providers: [
      CaseEditor,
      {
        provide: AuthSession,
        useValue: { profile: signal({ ref: 'actor' }) },
      },
      {
        provide: Feedback,
        useValue: { confirm: vi.fn().mockResolvedValue(true), show: vi.fn() },
      },
      {
        provide: WorkspaceApi,
        useValue: { get: async (): Promise<CaseRecord> => current },
      },
      {
        provide: RuntimeReader,
        useValue: {
          task: async (): Promise<ReturnType<typeof readRuntimeDocument>> =>
            readRuntimeDocument(dto),
          request: async (): Promise<ReturnType<typeof readRuntimeDocument>> =>
            readRuntimeDocument(dto),
        },
      },
      {
        provide: ApiClient,
        useValue: {
          call,
        },
      },
      {
        provide: BinaryTransfer,
        useValue: {
          run,
          cancel: vi.fn(),
          busy: signal(false),
          progress: signal(null),
        },
      },
    ],
  });
  const editor = TestBed.inject(CaseEditor);
  await editor.open(kind, current.ref);
  const files = TestBed.runInInjectionContext(() => new CaseResources(editor));
  return { files, editor, run, call };
}

describe('Known upload association', () => {
  it('does not report successful upload when the existing case command cannot confirm the link', async () => {
    const { files, run } = await setup();
    await expect(
      files.upload(
        '/amount',
        new File(['receipt'], 'receipt.txt'),
        false,
        'Receipt',
      ),
    ).rejects.toThrow();
    expect(run).toHaveBeenCalledOnce();
  });
  it('retains explicit attachment kind without granting preview to an unknown kind', async () => {
    const { files, call } = await setup();
    const common = {
      ref_id: 'attachment',
      upload_ref_id: 'private',
      field_path: '/amount',
      caption: 'Receipt',
      content_type: 'image/png',
      size_bytes: 4,
      position: 0,
    };
    call.mockReturnValueOnce(
      of(
        new HttpResponse({
          body: {
            success: true,
            data: [
              { ...common, kind: 'image' },
              { ...common, ref_id: 'ordinary-file', kind: 'file' },
              { ...common, ref_id: 'future-kind', kind: 'future' },
            ],
          },
        }),
      ),
    );
    expect(await files.attachments()).toMatchObject([
      { kind: 'image' },
      { kind: 'file' },
      { kind: 'unknown' },
    ]);
  });
  it.each(['request', 'task'] as const)(
    'uses the authorized %s attachment content operation',
    async (kind) => {
      const { files, run } = await setup(kind);
      const bytes = new Blob(['private image'], { type: 'image/png' });
      run.mockResolvedValueOnce(new HttpResponse({ body: bytes }));
      const controller = new AbortController();
      expect(
        await files.attachmentContent('owned-attachment', controller.signal),
      ).toBe(bytes);
      expect(run).toHaveBeenLastCalledWith(
        kind === 'task'
          ? 'download_work_item_attachment_api_v1_work_items__ref_id__attachments__attachment_ref_id__content_get'
          : 'download_attachment_api_v1_business_requests__ref_id__attachments__attachment_ref_id__content_get',
        {
          path: {
            ref_id: 'opaque/current',
            attachment_ref_id: 'owned-attachment',
          },
        },
        controller.signal,
      );
    },
  );
  it('does not deliver bytes read for a previous local case owner', async () => {
    const { files, editor, run } = await setup();
    let resolve!: (response: HttpResponse<Blob>) => void;
    run.mockReturnValueOnce(
      new Promise<HttpResponse<Blob>>((done) => {
        resolve = done;
      }),
    );
    const reading = files
      .attachmentContent('owned-attachment')
      .catch((error: unknown) => error);
    await editor.open('request', 'other-case');
    TestBed.tick();
    resolve(new HttpResponse({ body: new Blob(['old private bytes']) }));
    expect(await reading).toEqual(Error('Access or case changed.'));
  });
  it.each(['transfer', 'pending', 'actor'] as const)(
    'does not refresh from a late poll during %s ownership change',
    async (reason) => {
      const { files, editor, call } = await setup();
      const response = new Subject<HttpResponse<unknown>>();
      call.mockReturnValueOnce(response);
      const refresh = vi.spyOn(editor, 'refresh').mockResolvedValue();
      const polling = files.poll(new AbortController().signal);
      if (reason === 'transfer') {
        files.transferBusy.set(true);
      }
      if (reason === 'pending') {
        vi.spyOn(files, 'pendingAttachment').mockReturnValue({
          path: '/amount',
          fieldLabel: 'Receipts',
          name: 'receipt.txt',
          size: 4,
          caption: 'Receipt',
          phase: 'needs-check',
          message: 'Check first',
          presentInForm: true,
          canCheck: true,
          canRetry: false,
        });
      }
      if (reason === 'actor') {
        TestBed.inject(ActorState).reset();
      }
      response.next(
        new HttpResponse({
          body: { success: true, data: { ref_id: 'new-current' } },
        }),
      );
      await polling;
      expect(refresh).not.toHaveBeenCalled();
    },
  );
  it.each(['missing', 'decision'] as const)(
    'does not poll an unavailable case or unfinished %s draft',
    async (reason) => {
      const { files, editor, call } = await setup();
      call.mockClear();
      if (reason === 'missing') {
        editor.item.set(null);
      } else {
        editor.comment.set('Unsaved decision instructions');
      }
      await expect(
        files.poll(new AbortController().signal),
      ).resolves.toBeUndefined();
      expect(call).not.toHaveBeenCalled();
    },
  );
  it('still refreshes a changed current reference when the editor is idle', async () => {
    const { files, editor, call } = await setup();
    call.mockReturnValueOnce(
      of(
        new HttpResponse({
          body: { success: true, data: { ref_id: 'new-current' } },
        }),
      ),
    );
    const refresh = vi.spyOn(editor, 'refresh').mockResolvedValue();
    await files.poll(new AbortController().signal);
    expect(refresh).toHaveBeenCalledOnce();
  });
  it('ignores a prior case poll after navigation changes the local owner', async () => {
    const { files, editor, call } = await setup();
    const response = new Subject<HttpResponse<unknown>>();
    call.mockReturnValueOnce(response);
    const refresh = vi.spyOn(editor, 'refresh').mockResolvedValue();
    const polling = files.poll(new AbortController().signal);
    await editor.open('request', 'another-case');
    refresh.mockClear();
    response.next(
      new HttpResponse({
        body: { success: true, data: { ref_id: 'prior-case' } },
      }),
    );
    await polling;
    expect(refresh).not.toHaveBeenCalled();
  });
});
