import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { AuthSession } from '../../../core/auth/auth-session';
import { Feedback } from '../../../core/feedback/feedback';
import { ApiClient } from '../../../core/transport/api-client';
import { BinaryTransfer } from '../../../core/transport/binary-transfer';
import { RuntimeReader } from '../../forms/infrastructure/runtime-reader';
import { WorkspaceApi } from './workspace-api';
import { CaseEditor } from './case-editor';
import { CaseResources } from './case-resources';
import { CaseRecord } from '../domain/workspace-models';
describe('Dedicated AI approval commands', () => {
  let current: CaseRecord;
  let call: ReturnType<typeof vi.fn>;
  let taskReader: ReturnType<typeof vi.fn>;
  let resources: CaseResources;
  let editor: CaseEditor;
  beforeEach(async () => {
    current = {
      ref: 'initial',
      kind: 'AI_APPROVAL',
      status: 'OPEN',
      claimant: null,
      form: null,
      workflow: 'pinned',
      process: null,
      runtime: null,
    };
    taskReader = vi.fn();
    call = vi.fn().mockReturnValue(
      of(
        new HttpResponse({
          body: {
            success: true,
            data: { work_item_ref: 'decided', status: 'APPROVED' },
          },
        }),
      ),
    );
    TestBed.configureTestingModule({
      providers: [
        CaseEditor,
        {
          provide: AuthSession,
          useValue: {
            profile: signal({ ref: 'actor', username: 'Synthetic' }),
          },
        },
        {
          provide: Feedback,
          useValue: { confirm: vi.fn().mockResolvedValue(true), show: vi.fn() },
        },
        {
          provide: WorkspaceApi,
          useValue: {
            get: vi.fn(async () => current),
            lifecycle: vi.fn(async () => {
              current = {
                ...current,
                ref: 'claimed',
                status: 'CLAIMED',
                claimant: 'actor',
              };
              return current;
            }),
          },
        },
        {
          provide: RuntimeReader,
          useValue: { task: taskReader, request: vi.fn() },
        },
        { provide: ApiClient, useValue: { call } },
        {
          provide: BinaryTransfer,
          useValue: { busy: signal(false), progress: signal(null) },
        },
      ],
    });
    editor = TestBed.inject(CaseEditor);
    resources = TestBed.runInInjectionContext(() => new CaseResources(editor));
    await editor.open('task', 'initial');
  });
  it('claims a form-less item and never reads a human runtime view', async () => {
    await editor.lifecycle('claim');
    expect(editor.ownTask()).toBe(true);
    expect(taskReader).not.toHaveBeenCalled();
    expect(editor.document()).toBeNull();
  });
  it('sends only the explicit approved boolean and a stable command key to the dedicated endpoint', async () => {
    await editor.lifecycle('claim');
    await resources.decideApproval(false);
    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith(
      'decide_tool_approval_api_v1_ai_agents_work_items__work_item_ref__tool_approval_post',
      {
        path: { work_item_ref: 'claimed' },
        body: { approved: false, command_key: expect.any(String) },
      },
    );
    expect(taskReader).not.toHaveBeenCalled();
  });
  it('refuses decisions and forwarding when unclaimed, including forwarding after claim', async () => {
    await resources.decideApproval(true);
    expect(call).not.toHaveBeenCalled();
    await editor.lifecycle('claim');
    await resources.forward(['recipient'], [], 'Reason');
    expect(call).not.toHaveBeenCalled();
  });
  it('loads only the dedicated authorized payload and rejects malformed arguments', async () => {
    await editor.lifecycle('claim');
    call.mockReturnValueOnce(
      of(
        new HttpResponse({
          body: {
            success: true,
            data: {
              work_item_ref: 'claimed',
              tool_key: 'lookup_saved_report',
              tool_version: '1',
              status: 'PENDING',
              expires_at: '2030-01-01T00:00:00Z',
              arguments: { report_ref: 'owned', limit: 1 },
            },
          },
        }),
      ),
    );
    expect((await resources.approval()).arguments).toEqual({
      report_ref: 'owned',
      limit: 1,
    });
    expect(call.mock.calls[0][0]).toBe(
      'tool_approval_detail_api_v1_ai_agents_work_items__work_item_ref__tool_approval_get',
    );
    expect(taskReader).not.toHaveBeenCalled();
  });
});
