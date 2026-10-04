import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ApiFailure } from '../../../core/transport/api-failure';
import { ActorState } from '../../../core/auth/actor-state';
import { AuthSession } from '../../../core/auth/auth-session';
import { Feedback } from '../../../core/feedback/feedback';
import { RuntimeReader } from '../../forms/infrastructure/runtime-reader';
import { readRuntimeDocument } from '../../forms/infrastructure/runtime-document-adapter';
import { runtimeFixture } from '../../forms/testing/runtime-fixtures';
import { CaseRecord } from '../domain/workspace-models';
import { CaseEditor } from './case-editor';
import { WorkspaceApi } from './workspace-api';
import { RequestCreation } from './request-creation';
import { MISSING } from '../../forms/domain/canonical-values';
function item(reference = 'initial', status = 'DRAFT'): CaseRecord {
  return {
    ref: reference,
    status,
    kind: 'HUMAN_TASK',
    claimant: status === 'DRAFT' ? null : 'actor',
    form: 'pinned',
    workflow: 'workflow',
    process: null,
    runtime: null,
  };
}
describe('Requester and reviewer command journeys', () => {
  let calls: {
    operation: string;
    reference: string;
    data?: unknown;
    key?: string | null;
    deleted?: readonly string[];
    outcome?: string;
    comment?: string;
  }[];
  let dto: Record<string, unknown>;
  let current: CaseRecord;
  let failure: ApiFailure | null;
  beforeEach(() => {
    calls = [];
    dto = runtimeFixture('REQUEST');
    current = item();
    failure = null;
    TestBed.configureTestingModule({
      providers: [
        CaseEditor,
        {
          provide: AuthSession,
          useValue: {
            profile: signal({ ref: 'actor', username: 'Synthetic actor' }),
          },
        },
        {
          provide: RuntimeReader,
          useValue: {
            request: async (): Promise<
              ReturnType<typeof readRuntimeDocument>
            > => readRuntimeDocument(dto),
            task: async (): Promise<ReturnType<typeof readRuntimeDocument>> =>
              readRuntimeDocument(dto),
          },
        },
        {
          provide: WorkspaceApi,
          useValue: {
            get: async (): Promise<CaseRecord> => current,
            save: async (
              _kind: string,
              reference: string,
              data: unknown,
              _view: string,
              deleted: readonly string[],
              key: string | null,
            ): Promise<CaseRecord> => {
              calls.push({ operation: 'save', reference, data, key, deleted });
              if (failure) {
                throw failure;
              }
              current = item('saved', current.status);
              dto['resource_ref_id'] = 'saved';
              dto['data'] = data;
              return current;
            },
            submit: async (
              reference: string,
              key: string,
            ): Promise<CaseRecord> => {
              calls.push({ operation: 'submit', reference, key });
              current = item('submitted', 'RUNNING');
              dto['purpose'] = 'summary';
              dto['writable_scopes'] = [];
              dto['field_metadata'] = (
                dto['field_metadata'] as Record<string, unknown>[]
              ).map((field) => ({ ...field, writable: false }));
              dto['actions'] = [];
              return current;
            },
            decide: async (
              reference: string,
              operation: string,
              key: string,
              data: unknown,
              _view: string,
              deleted: readonly string[],
              outcome: string,
              comment: string,
            ): Promise<CaseRecord> => {
              calls.push({
                reference,
                operation,
                key,
                data,
                deleted,
                outcome,
                comment,
              });
              return item('closed', 'COMPLETED');
            },
          },
        },
      ],
    });
    vi.spyOn(TestBed.inject(Feedback), 'confirm').mockResolvedValue(true);
  });
  it('flushes changed canonical data then submits the saved reference with only a stable submit key', async () => {
    const editor = TestBed.inject(CaseEditor);
    await editor.open('request', 'initial');
    editor.edit({ scope: '/properties/amount', value: 150 });
    await editor.submit();
    expect(calls.map((call) => call.operation)).toEqual(['save', 'submit']);
    expect(calls[0].data).toMatchObject({ amount: 150 });
    expect(calls[1].reference).toBe('saved');
    expect(calls[1].key).toBeTruthy();
    expect(calls[1].data).toBeUndefined();
    expect(editor.item()?.status).toBe('RUNNING');
  });
  it('never submits after failed save and retains edits for explicit conflict reconciliation', async () => {
    const editor = TestBed.inject(CaseEditor);
    await editor.open('request', 'initial');
    editor.edit({ scope: '/properties/amount', value: 150 });
    failure = new ApiFailure(409, 1004, null, [], false, 'revision');
    await editor.submit();
    expect(calls.map((call) => call.operation)).toEqual(['save']);
    expect(editor.blocked()).toBe(true);
    expect(editor.data()['amount']).toBe(150);
  });
  it('sends only writable task data with explicit deletion and declared return outcome', async () => {
    current = item('task', 'CLAIMED');
    dto = runtimeFixture();
    dto['purpose'] = 'correction';
    dto['before_data'] = { amount: 100 };
    dto['writable_scopes'] = ['/properties/amount', '/properties/decimal'];
    dto['field_metadata'] = (
      dto['field_metadata'] as Record<string, unknown>[]
    ).map((field) => ({
      ...field,
      writable: (dto['writable_scopes'] as string[]).includes(
        String(field['scope']),
      ),
    }));
    dto['actions'] = [
      {
        key: 'fix',
        kind: 'return',
        outcome_key: 'CORRECT',
        title: 'Return',
        confirmation: null,
        required_scopes: [],
        require_comment: true,
        validation: 'partial',
      },
    ];
    const editor = TestBed.inject(CaseEditor);
    await editor.open('task', 'task');
    editor.edit({ scope: '/properties/approved', value: true });
    expect(editor.data()['approved']).toBe(false);
    editor.edit({ scope: '/properties/decimal', value: MISSING });
    editor.comment.set('Please correct');
    await editor.decide(editor.document()!.actions[0]);
    expect(calls[0].operation).toBe('return');
    expect(calls[0].outcome).toBe('CORRECT');
    expect(calls[0].comment).toBe('Please correct');
    expect(calls[0].data).toEqual({ amount: 125 });
    expect(calls[0].deleted).toEqual(['/decimal']);
    expect(calls[0].key).toBeTruthy();
  });
  it('blocks an observer decision and clears data when the actor changes', async () => {
    current = { ...item('task', 'CLAIMED'), claimant: 'someone-else' };
    dto = runtimeFixture();
    const editor = TestBed.inject(CaseEditor);
    await editor.open('task', 'task');
    await editor.decide(editor.document()!.actions[0]);
    expect(calls).toEqual([]);
    TestBed.inject(ActorState).reset();
    expect(editor.item()).toBeNull();
    expect(editor.data()).toEqual({});
  });
  it('retains only edited writable fields when reconciling a newer runtime', async () => {
    const editor = TestBed.inject(CaseEditor);
    await editor.open('request', 'initial');
    editor.edit({ scope: '/properties/amount', value: 150 });
    dto['data'] = {
      amount: 130,
      decimal: 'new server value',
      approved: false,
      choice: 1,
    };
    dto['resource_ref_id'] = 'new revision';
    await editor.refresh(true);
    expect(editor.data()['amount']).toBe(150);
    expect(editor.data()['decimal']).toBe('new server value');
    expect(editor.blocked()).toBe(false);
    expect(editor.dirty()).toBe(true);
  });
  it.each(['AI_APPROVAL', 'UNSUPPORTED'] as const)(
    'keeps %s separate from human editing',
    async (kind) => {
      current = { ...item('task', 'CLAIMED'), kind };
      const editor = TestBed.inject(CaseEditor);
      await editor.open('task', 'task');
      expect(editor.document()).toBeNull();
      expect(editor.canEdit()).toBe(false);
      expect(calls).toEqual([]);
    },
  );
  it.each(['COMPLETED', 'REJECTED', 'RETURNED', 'CANCELLED', 'EXPIRED'])(
    'blocks decisions on a %s task',
    async (status) => {
      current = item('task', status);
      dto = runtimeFixture();
      const editor = TestBed.inject(CaseEditor);
      await editor.open('task', 'task');
      await editor.decide(editor.document()!.actions[0]);
      expect(calls).toEqual([]);
    },
  );
  it('does not save invalid raw numeric input while leaving its previous canonical value intact', async () => {
    const editor = TestBed.inject(CaseEditor);
    await editor.open('request', 'initial');
    editor.edit({
      scope: '/properties/amount',
      value: 125,
      error: 'Enter a valid number',
    });
    expect(await editor.save()).toBe(false);
    expect(calls).toEqual([]);
  });
});
describe('Deliberate draft creation', () => {
  it('suppresses double clicks, fences actors, and requires reconciliation after a timeout', async () => {
    let resolve!: (value: CaseRecord) => void;
    const create = vi.fn(
      () =>
        new Promise<CaseRecord>((done) => {
          resolve = done;
        }),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: WorkspaceApi, useValue: { create } }],
    });
    const creation = TestBed.inject(RequestCreation);
    const work = creation.create('type');
    expect(await creation.create('type')).toBeNull();
    TestBed.inject(ActorState).reset();
    resolve(item());
    expect(await work).toBeNull();
    expect(create).toHaveBeenCalledTimes(1);
    create.mockRejectedValueOnce(new ApiFailure(0, null, null, [], true));
    await creation.create('type');
    expect(creation.uncertain()).toBe(true);
    expect(await creation.create('type')).toBeNull();
    expect(create).toHaveBeenCalledTimes(2);
  });
});
