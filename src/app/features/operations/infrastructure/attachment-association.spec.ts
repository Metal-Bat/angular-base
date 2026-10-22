import { signal } from '@angular/core';
import { ActorState } from '../../../core/auth/actor-state';
import { CaseRecord } from '../domain/workspace-models';
import { attachmentRuntime } from '../testing/attachment-runtime';
import {
  AttachmentAssociation,
  AttachmentCommand,
  AttachmentLink,
} from './attachment-association';

function setup(nested = false): {
  association: AttachmentAssociation;
  actor: ActorState;
  editor: ConstructorParameters<typeof AttachmentAssociation>[0];
  read: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  changeReference(reference: string): void;
  document: ReturnType<typeof signal<ReturnType<typeof attachmentRuntime>>>;
  owner: ReturnType<typeof signal<string>>;
  dirty: ReturnType<typeof signal<boolean>>;
  editable: ReturnType<typeof signal<boolean>>;
  error: ReturnType<typeof signal<string>>;
} {
  const actor = new ActorState();
  const document = signal(attachmentRuntime(nested));
  const item = signal<CaseRecord>({
    ref: document().identity.resource,
    status: 'DRAFT',
    kind: 'HUMAN_TASK',
    claimant: null,
    form: 'pinned',
    workflow: 'workflow',
    process: null,
    runtime: null,
  });
  const owner = signal('request:original');
  const dirty = signal(false);
  const editable = signal(true);
  const error = signal('');
  const changeReference = (reference: string): void => {
    item.update((current) => ({ ...current, ref: reference }));
    document.update((current) => ({
      ...current,
      identity: { ...current.identity, resource: reference },
    }));
  };
  const editor = {
    contextKey: owner,
    item,
    document,
    dirty,
    canEdit: editable,
    busy: signal(false),
    blocked: signal(false),
    error,
    refresh: vi.fn(async (): Promise<void> =>
      changeReference('checked-current'),
    ),
  };
  const read = vi.fn().mockResolvedValue([]);
  const send = vi.fn().mockResolvedValue(false);
  const association = new AttachmentAssociation(editor, actor, read, send);
  return {
    association,
    actor,
    editor,
    read,
    send,
    changeReference,
    document,
    owner,
    dirty,
    editable,
    error,
  };
}
async function failedUpload(
  vm: ReturnType<typeof setup>,
  path = '/amount',
  replacement: string | null = null,
): Promise<void> {
  const context = vm.association.prepare(
    path,
    'receipt.txt',
    7,
    'Receipt',
    replacement,
  );
  await expect(
    vm.association.attach(context, 'known-upload'),
  ).rejects.toThrow();
}

describe('Retained attachment association', () => {
  it('requires an authoritative absence check before retrying the same frozen payload', async () => {
    const vm = setup();
    await failedUpload(vm);
    expect(JSON.stringify(vm.association.state())).not.toContain(
      'known-upload',
    );
    expect(vm.association.state()).toMatchObject({
      phase: 'needs-check',
      canRetry: false,
      name: 'receipt.txt',
    });
    await vm.association.retry();
    expect(vm.send).toHaveBeenCalledOnce();
    await vm.association.check();
    expect(vm.association.state()).toMatchObject({
      phase: 'ready',
      canRetry: true,
    });
    const first = vm.send.mock.calls[0][0] as AttachmentCommand;
    expect(first.payload).toEqual({
      field_path: '/amount',
      upload_ref_id: 'known-upload',
      caption: 'Receipt',
    });
    expect(Object.isFrozen(first.payload)).toBe(true);
    vm.send.mockResolvedValueOnce(true);
    await vm.association.retry();
    expect(vm.send).toHaveBeenCalledTimes(2);
    expect((vm.send.mock.calls[1][0] as AttachmentCommand).payload).toBe(
      first.payload,
    );
    expect(vm.editor.item()?.ref).toBe('checked-current');
    expect(vm.association.state()).toBeNull();
  });
  it('confirms an already-linked upload without issuing another mutation', async () => {
    const vm = setup();
    await failedUpload(vm);
    vm.read.mockResolvedValue([
      { ref: 'linked', path: '/amount', uploadRef: 'known-upload' },
    ]);
    await vm.association.check();
    expect(vm.send).toHaveBeenCalledOnce();
    expect(vm.association.state()).toBeNull();
  });
  it('does not treat a retained runtime after a failed refresh as authoritative absence', async () => {
    const vm = setup();
    await failedUpload(vm);
    vi.spyOn(vm.editor, 'refresh').mockImplementationOnce(
      async (): Promise<void> => {
        vm.error.set('Private refresh failure');
      },
    );
    await vm.association.check();
    expect(vm.read).not.toHaveBeenCalled();
    expect(vm.association.state()).toMatchObject({
      phase: 'needs-check',
      canRetry: false,
    });
    expect(JSON.stringify(vm.association.state())).not.toContain(
      'Private refresh failure',
    );
    await vm.association.retry();
    expect(vm.send).toHaveBeenCalledOnce();
  });
  it('can confirm an existing link after the field becomes read-only without authorizing a new write', async () => {
    const vm = setup();
    await failedUpload(vm);
    vm.editable.set(false);
    vm.read.mockResolvedValue([
      { ref: 'linked', path: '/amount', uploadRef: 'known-upload' },
    ]);
    await vm.association.check();
    expect(vm.association.state()).toBeNull();
    expect(vm.send).toHaveBeenCalledOnce();
  });
  it('cannot retry after a failed read or a changed checked revision', async () => {
    const vm = setup();
    await failedUpload(vm);
    vm.read.mockRejectedValueOnce(Error('Private server details'));
    await vm.association.check();
    expect(vm.association.state()).toMatchObject({
      phase: 'needs-check',
      canRetry: false,
    });
    expect(JSON.stringify(vm.association.state())).not.toContain(
      'Private server details',
    );
    await vm.association.retry();
    expect(vm.send).toHaveBeenCalledOnce();
    await vm.association.check();
    vm.changeReference('newer-current');
    expect(vm.association.state()?.canRetry).toBe(false);
    await vm.association.retry();
    expect(vm.send).toHaveBeenCalledOnce();
    expect(vm.association.state()?.phase).toBe('needs-check');
  });
  it('retains a known handle when the current reference changes during byte upload', async () => {
    const vm = setup();
    const context = vm.association.prepare(
      '/amount',
      'receipt.txt',
      7,
      '',
      null,
    );
    vm.changeReference('newer-current');
    await expect(
      vm.association.attach(context, 'known-upload'),
    ).rejects.toThrow();
    expect(vm.send).not.toHaveBeenCalled();
    await vm.association.check();
    vm.send.mockResolvedValueOnce(true);
    await vm.association.retry();
    expect(vm.send).toHaveBeenCalledOnce();
  });
  it('fences a late read after actor change and hides state for a different owner', async () => {
    const vm = setup();
    await failedUpload(vm);
    let resolve!: (links: readonly AttachmentLink[]) => void;
    vm.read.mockReturnValueOnce(
      new Promise<readonly AttachmentLink[]>((done) => {
        resolve = done;
      }),
    );
    const checking = vm.association.check();
    await vi.waitFor(() => expect(vm.read).toHaveBeenCalledOnce());
    vm.actor.reset();
    vm.association.clear();
    resolve([{ ref: 'linked', path: '/amount', uploadRef: 'known-upload' }]);
    await checking;
    expect(vm.association.state()).toBeNull();
    expect(vm.send).toHaveBeenCalledOnce();
    const next = setup();
    await failedUpload(next);
    next.owner.set('request:other');
    expect(next.association.state()).toBeNull();
  });
  it('does not retarget a moved row even when the same numeric path contains the upload', async () => {
    const vm = setup(true);
    await failedUpload(vm, '/amount/0/files');
    vm.document.update((current) => ({
      ...current,
      rowIdentity: { '/amount': ['row-b'] },
    }));
    vm.read.mockResolvedValue([
      { ref: 'linked', path: '/amount/0/files', uploadRef: 'known-upload' },
    ]);
    await vm.association.check();
    expect(vm.association.state()).toMatchObject({
      phase: 'target-changed',
      presentInForm: false,
      canRetry: false,
    });
    await vm.association.retry();
    expect(vm.send).toHaveBeenCalledOnce();
  });
  it('preserves replacement payloads and refuses a changed replacement target', async () => {
    const vm = setup();
    await failedUpload(vm, '/amount', 'attachment-original');
    expect((vm.send.mock.calls[0][0] as AttachmentCommand).payload).toEqual({
      upload_ref_id: 'known-upload',
      caption: 'Receipt',
    });
    vm.read.mockResolvedValue([
      {
        ref: 'attachment-new-revision',
        path: '/amount',
        uploadRef: 'older-upload',
      },
    ]);
    await vm.association.check();
    expect(vm.association.state()).toMatchObject({
      phase: 'target-changed',
      canRetry: false,
    });
    expect(vm.send).toHaveBeenCalledOnce();
  });
  it('retains unknown placement outcomes rather than attaching an upload linked elsewhere twice', async () => {
    const vm = setup();
    await failedUpload(vm);
    vm.read.mockResolvedValue([
      { ref: 'linked', path: '/other', uploadRef: 'known-upload' },
    ]);
    await vm.association.check();
    expect(vm.association.state()?.phase).toBe('target-changed');
    await vm.association.retry();
    expect(vm.send).toHaveBeenCalledOnce();
  });
  it('blocks a second upload and unsaved/read-only retries while preserving the pending handle', async () => {
    const vm = setup();
    await failedUpload(vm);
    expect(() =>
      vm.association.prepare('/amount', 'second.txt', 7, '', null),
    ).toThrow();
    await vm.association.check();
    vm.dirty.set(true);
    await vm.association.retry();
    expect(vm.send).toHaveBeenCalledOnce();
    expect(vm.association.state()).not.toBeNull();
    vm.dirty.set(false);
    await vm.association.check();
    vm.editable.set(false);
    await vm.association.retry();
    expect(vm.send).toHaveBeenCalledOnce();
  });
});
