import { computed, signal } from '@angular/core';
import { ActorState } from '../../../core/auth/actor-state';
import { PendingAttachment } from '../../forms/application/form-resources';
import { EditorPort } from '../application/workspace-ports';
import {
  AttachmentTarget,
  attachmentTarget,
  sameAttachmentTarget,
} from '../domain/attachment-target';

export type AttachmentLink = { ref: string; path: string; uploadRef: string };
export type UploadContext = {
  owner: string;
  epoch: number;
  revision: number;
  reference: string;
  path: string;
  target: AttachmentTarget;
  name: string;
  size: number;
  caption: string | null;
  replacement: string | null;
};
type AddPayload = Readonly<{
  field_path: string;
  upload_ref_id: string;
  caption: string | null;
}>;
type ReplacePayload = Readonly<{
  upload_ref_id: string;
  caption: string | null;
}>;
export type AttachmentCommand = { context: UploadContext } & (
  | { kind: 'add'; replacement: null; payload: AddPayload }
  | { kind: 'replace'; replacement: string; payload: ReplacePayload }
);
type Pending = AttachmentCommand & {
  phase: 'needs-check' | 'checking' | 'ready' | 'linking' | 'target-changed';
  checkedReference: string | null;
  message: string;
};
type AttachmentEditor = Pick<
  EditorPort,
  | 'contextKey'
  | 'error'
  | 'item'
  | 'document'
  | 'busy'
  | 'blocked'
  | 'dirty'
  | 'canEdit'
  | 'refresh'
>;

/** Retains a known upload while the existing case command owns every link mutation. */
export class AttachmentAssociation {
  private readonly pending = signal<Pending | null>(null);
  private revision = 0;
  readonly state = computed<PendingAttachment | null>(() => {
    const pending = this.pending();
    if (!pending || !this.current(pending.context)) {
      return null;
    }
    return {
      fieldLabel: pending.context.target.label,
      presentInForm:
        !!this.editor.document() &&
        sameAttachmentTarget(
          pending.context.target,
          attachmentTarget(
            this.editor.document()!,
            pending.context.path,
            false,
          ),
        ),
      path: pending.context.path,
      name: pending.context.name,
      size: pending.context.size,
      caption: pending.context.caption,
      phase: pending.phase,
      message: pending.message,
      canCheck:
        !this.editor.busy() && !['checking', 'linking'].includes(pending.phase),
      canRetry:
        pending.phase === 'ready' &&
        this.writable(pending) &&
        pending.checkedReference === this.editor.item()?.ref,
    };
  });
  constructor(
    private readonly editor: AttachmentEditor,
    private readonly actor: ActorState,
    private readonly read: () => Promise<readonly AttachmentLink[]>,
    private readonly send: (command: AttachmentCommand) => Promise<boolean>,
  ) {}
  clear(): void {
    this.revision++;
    this.pending.set(null);
  }
  prepare(
    path: string,
    name: string,
    size: number,
    caption: string,
    replacement: string | null,
  ): UploadContext {
    const document = this.editor.document();
    const target = document ? attachmentTarget(document, path) : null;
    if (
      this.pending() ||
      !target ||
      !this.editor.canEdit() ||
      this.editor.dirty()
    ) {
      throw Error(
        'Check the pending attachment or save your form before choosing another file.',
      );
    }
    return {
      owner: this.editor.contextKey(),
      epoch: this.actor.epoch,
      revision: this.revision,
      reference: this.editor.item()!.ref,
      path,
      target,
      name,
      size,
      caption: caption || null,
      replacement,
    };
  }
  async attach(context: UploadContext, uploadRef: string): Promise<void> {
    if (!this.current(context)) {
      throw Error('Access or case changed. Upload was not linked.');
    }
    const command: AttachmentCommand =
      context.replacement === null
        ? {
            context,
            kind: 'add',
            replacement: null,
            payload: Object.freeze({
              field_path: context.path,
              upload_ref_id: uploadRef,
              caption: context.caption,
            }),
          }
        : {
            context,
            kind: 'replace',
            replacement: context.replacement,
            payload: Object.freeze({
              upload_ref_id: uploadRef,
              caption: context.caption,
            }),
          };
    const pending: Pending = {
      ...command,
      phase: 'needs-check',
      checkedReference: null,
      message:
        'The file was uploaded. Check whether it is attached before retrying.',
    };
    this.pending.set(pending);
    if (
      context.reference !== this.editor.item()?.ref ||
      !this.writable(pending)
    ) {
      throw Error(pending.message);
    }
    if (!(await this.commit(pending))) {
      throw Error(pending.message);
    }
  }
  async check(): Promise<void> {
    const pending = this.pending();
    if (
      !pending ||
      !this.current(pending.context) ||
      this.editor.busy() ||
      ['checking', 'linking'].includes(pending.phase)
    ) {
      return;
    }
    this.pending.set({
      ...pending,
      phase: 'checking',
      checkedReference: null,
      message: 'Checking attachment state…',
    });
    try {
      await this.editor.refresh();
      if (!this.current(pending.context)) {
        return;
      }
      const reference = this.readReference();
      const links = await this.read();
      if (!this.current(pending.context)) {
        return;
      }
      if (reference !== this.readReference()) {
        throw Error(
          'The current revision changed. Check attachment state again.',
        );
      }
      this.reconcile(pending, links, reference);
    } catch (error) {
      if (this.current(pending.context)) {
        this.pending.set({
          ...pending,
          phase: 'needs-check',
          checkedReference: null,
          message:
            error instanceof Error &&
            [
              'Save or discard form edits before checking this upload.',
              'The current revision changed. Check attachment state again.',
            ].includes(error.message)
              ? error.message
              : 'Attachment state could not be confirmed. Check again before retrying.',
        });
      }
    }
  }
  async retry(): Promise<void> {
    const pending = this.pending();
    if (
      !pending ||
      pending.phase !== 'ready' ||
      !this.current(pending.context)
    ) {
      return;
    }
    if (
      pending.checkedReference !== this.editor.item()?.ref ||
      !this.writable(pending)
    ) {
      this.pending.set({
        ...pending,
        phase: 'needs-check',
        checkedReference: null,
        message: 'The current revision changed. Check attachment state again.',
      });
      return;
    }
    await this.commit(pending);
  }
  private readReference(): string {
    const document = this.editor.document();
    const reference = this.editor.item()?.ref;
    if (this.editor.dirty()) {
      throw Error('Save or discard form edits before checking this upload.');
    }
    if (
      this.editor.busy() ||
      this.editor.blocked() ||
      this.editor.error() ||
      !document ||
      !reference ||
      document.identity.resource !== reference
    ) {
      throw Error(
        'Attachment state could not be confirmed. Check again before retrying.',
      );
    }
    return reference;
  }
  private reconcile(
    pending: Pending,
    links: readonly AttachmentLink[],
    reference: string,
  ): void {
    const document = this.editor.document()!;
    const visibleTarget = attachmentTarget(
      document,
      pending.context.path,
      false,
    );
    if (!sameAttachmentTarget(pending.context.target, visibleTarget)) {
      this.pending.set({
        ...pending,
        phase: 'target-changed',
        checkedReference: null,
        message:
          'The original attachment field or row changed. Discard this pending link before choosing again.',
      });
      return;
    }
    const linked = links.find(
      (item) =>
        item.uploadRef === pending.payload.upload_ref_id &&
        item.path === pending.context.path,
    );
    if (linked) {
      this.clear();
      return;
    }
    const target = attachmentTarget(document, pending.context.path);
    const changed =
      links.some((item) => item.uploadRef === pending.payload.upload_ref_id) ||
      !sameAttachmentTarget(pending.context.target, target) ||
      (!!pending.replacement &&
        !links.some(
          (item) =>
            item.ref === pending.replacement &&
            item.path === pending.context.path,
        ));
    this.pending.set({
      ...pending,
      phase: changed ? 'target-changed' : 'ready',
      checkedReference: changed ? null : reference,
      message: changed
        ? 'The original attachment field or row changed. Discard this pending link before choosing again.'
        : 'The uploaded file is not attached. Retry the link without uploading the file again.',
    });
  }
  private current(context: UploadContext): boolean {
    return (
      context.revision === this.revision &&
      context.epoch === this.actor.epoch &&
      context.owner === this.editor.contextKey()
    );
  }
  private writable(pending: Pending): boolean {
    const document = this.editor.document();
    return (
      this.current(pending.context) &&
      this.editor.canEdit() &&
      !this.editor.busy() &&
      !this.editor.blocked() &&
      !this.editor.dirty() &&
      !!document &&
      sameAttachmentTarget(
        pending.context.target,
        attachmentTarget(document, pending.context.path),
      )
    );
  }
  private async commit(pending: Pending): Promise<boolean> {
    this.pending.set({
      ...pending,
      phase: 'linking',
      checkedReference: null,
      message: 'Attaching uploaded file…',
    });
    let confirmed = false;
    try {
      confirmed = await this.send(pending);
    } catch {
      /* Existing case command owns diagnostics. */
    }
    if (!this.current(pending.context)) {
      return false;
    }
    if (confirmed) {
      this.clear();
      return true;
    }
    this.pending.set({
      ...pending,
      phase: 'needs-check',
      checkedReference: null,
      message:
        'The file was uploaded. Check whether it is attached before retrying.',
    });
    return false;
  }
}
