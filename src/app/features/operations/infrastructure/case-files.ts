import { HttpResponse } from '@angular/common/http';
import { DestroyRef, effect, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  BinaryTransfer,
  safeFilename,
} from '../../../core/transport/binary-transfer';
import { record } from '../../../core/transport/api-failure';
import { readData } from '../../../core/transport/response-adapters';
import {
  Attachment,
  PendingAttachment,
} from '../../forms/application/form-resources';
import { EditorPort } from '../application/workspace-ports';
import {
  AttachmentAssociation,
  AttachmentCommand,
} from './attachment-association';
import { CaseCollections } from './case-collections';
import { stringField } from './workspace-decoders';
type CaseAttachment = Attachment & { uploadRef: string };
export class CaseFiles extends CaseCollections {
  private readonly transfer = inject(BinaryTransfer);
  readonly transferBusy = this.transfer.busy;
  readonly progress = this.transfer.progress;
  readonly ownerKey = (): string => this.editor.contextKey();
  private readonly association: AttachmentAssociation;
  readonly pendingAttachment = (): PendingAttachment | null =>
    this.association.state();
  constructor(editor: EditorPort) {
    super(editor);
    this.association = new AttachmentAssociation(
      editor,
      this.actor,
      () => this.readAttachments(),
      (command) => this.sendAttachment(command),
    );
    const release = this.actor.register(() => this.association.clear());
    inject(DestroyRef).onDestroy(() => {
      release();
      this.association.clear();
    });
    let owner = editor.contextKey();
    effect(() => {
      const current = editor.contextKey();
      if (current !== owner) {
        owner = current;
        this.association.clear();
        this.transfer.cancel();
      }
    });
  }
  protected override async flush(): Promise<boolean> {
    return !this.pendingAttachment() && (await super.flush());
  }
  checkPendingAttachment(): Promise<void> {
    return this.association.check();
  }
  retryPendingAttachment(): Promise<void> {
    return this.association.retry();
  }
  discardPendingAttachment(): void {
    const pending = this.pendingAttachment();
    if (pending && !['checking', 'linking'].includes(pending.phase)) {
      this.association.clear();
    }
  }
  async attachments(): Promise<readonly Attachment[]> {
    return (await this.readAttachments()).map((item) => ({
      ref: item.ref,
      path: item.path,
      caption: item.caption,
      kind: item.kind,
      contentType: item.contentType,
      size: item.size,
      position: item.position,
    }));
  }
  private async readAttachments(): Promise<readonly CaseAttachment[]> {
    const response = this.task
      ? await firstValueFrom(
          this.api.call(
            'list_work_item_attachments_api_v1_work_items__ref_id__attachments_get',
            { path: { ref_id: this.reference } },
          ),
        )
      : await firstValueFrom(
          this.api.call(
            'list_attachments_api_v1_business_requests__ref_id__attachments_get',
            { path: { ref_id: this.reference } },
          ),
        );
    return readData(response, (value) => {
      if (!Array.isArray(value) || value.length > 1024) {
        throw Error('Invalid attachments');
      }
      return value.map((raw) => {
        const item = record(raw);
        if (
          !Number.isSafeInteger(item['size_bytes']) ||
          !Number.isSafeInteger(item['position'])
        ) {
          throw Error('Invalid attachment');
        }
        const kind = item['kind'];
        return {
          kind:
            kind === 'file' || kind === 'image' ? kind : ('unknown' as const),
          ref: stringField(item, 'ref_id'),
          uploadRef: stringField(item, 'upload_ref_id'),
          path: stringField(item, 'field_path'),
          caption: String(item['caption'] ?? ''),
          contentType: stringField(item, 'content_type'),
          size: Number(item['size_bytes']),
          position: Number(item['position']),
        };
      });
    });
  }
  private async uploadReference(
    file: File,
    image: boolean,
    abort?: AbortSignal,
  ): Promise<string> {
    const response = await this.transfer.run(
      image
        ? 'upload_image_api_v1_media_images_post'
        : 'upload_file_api_v1_media_files_post',
      { body: { upload: file } },
      abort,
    );
    const body: unknown = JSON.parse(await response.body!.text());
    return readData(response.clone({ body }), (value) =>
      stringField(record(value), 'ref_id'),
    );
  }
  async upload(
    path: string,
    file: File,
    image: boolean,
    caption: string,
    abort?: AbortSignal,
  ): Promise<void> {
    await this.uploadFile(path, file, image, caption, null, abort);
  }
  async replaceAttachment(
    reference: string,
    file: File,
    image: boolean,
    caption: string,
    abort?: AbortSignal,
  ): Promise<void> {
    const owner = this.editor.contextKey();
    const epoch = this.actor.epoch;
    const items = await this.readAttachments();
    const item = items.find((entry) => entry.ref === reference);
    if (
      abort?.aborted ||
      !item ||
      owner !== this.editor.contextKey() ||
      epoch !== this.actor.epoch
    ) {
      throw Error(
        'The original attachment changed. Check current state before choosing again.',
      );
    }
    await this.uploadFile(item.path, file, image, caption, reference, abort);
  }
  private async uploadFile(
    path: string,
    file: File,
    image: boolean,
    caption: string,
    replacement: string | null,
    abort?: AbortSignal,
  ): Promise<void> {
    const owner = this.editor.contextKey();
    const epoch = this.actor.epoch;
    if (
      abort?.aborted ||
      !this.editor.canEdit() ||
      !(await this.flush()) ||
      owner !== this.editor.contextKey() ||
      epoch !== this.actor.epoch ||
      abort?.aborted
    ) {
      throw Error(
        'Check the pending attachment or save your form before choosing another file.',
      );
    }
    const context = this.association.prepare(
      path,
      safeFilename(file.name),
      file.size,
      caption,
      replacement,
    );
    const upload = await this.uploadReference(file, image, abort);
    await this.association.attach(context, upload);
  }
  private async sendAttachment(command: AttachmentCommand): Promise<boolean> {
    if (command.kind === 'add') {
      return this.editor.command(command.payload, async (reference, body) => {
        const response = this.task
          ? await firstValueFrom(
              this.api.call(
                'add_work_item_attachment_api_v1_work_items__ref_id__attachments_post',
                { path: { ref_id: reference }, body },
              ),
            )
          : await firstValueFrom(
              this.api.call(
                'add_attachment_api_v1_business_requests__ref_id__attachments_post',
                { path: { ref_id: reference }, body },
              ),
            );
        return readData(response, (value) => this.referenceFrom(value));
      });
    }
    return this.editor.command(command.payload, async (reference, body) => {
      const path = {
        ref_id: reference,
        attachment_ref_id: command.replacement,
      };
      const response = this.task
        ? await firstValueFrom(
            this.api.call(
              'replace_work_item_attachment_api_v1_work_items__ref_id__attachments__attachment_ref_id__put',
              { path, body },
            ),
          )
        : await firstValueFrom(
            this.api.call(
              'replace_attachment_api_v1_business_requests__ref_id__attachments__attachment_ref_id__put',
              { path, body },
            ),
          );
      return readData(response, (value) => this.referenceFrom(value));
    });
  }
  async removeAttachment(attachment: string): Promise<void> {
    if (
      !this.editor.canEdit() ||
      !(await this.flush()) ||
      !(await this.editor.feedback.confirm('Remove this attachment?'))
    ) {
      return;
    }
    await this.editor.command({ attachment }, async (reference, body) => {
      const path = { ref_id: reference, attachment_ref_id: body.attachment };
      const response = this.task
        ? await firstValueFrom(
            this.api.call(
              'remove_work_item_attachment_api_v1_work_items__ref_id__attachments__attachment_ref_id__delete',
              { path },
            ),
          )
        : await firstValueFrom(
            this.api.call(
              'remove_attachment_api_v1_business_requests__ref_id__attachments__attachment_ref_id__delete',
              { path },
            ),
          );
      return readData(response, (value) => this.referenceFrom(value));
    });
  }
  async reorderAttachments(
    path: string,
    references: readonly string[],
  ): Promise<void> {
    if (!this.editor.canEdit() || !(await this.flush())) {
      return;
    }
    await this.editor.command(
      { field_path: path, attachment_ref_ids: [...references] },
      async (reference, body) => {
        const response = this.task
          ? await firstValueFrom(
              this.api.call(
                'reorder_work_item_attachments_api_v1_work_items__ref_id__attachments_put',
                { path: { ref_id: reference }, body },
              ),
            )
          : await firstValueFrom(
              this.api.call(
                'reorder_attachments_api_v1_business_requests__ref_id__attachments_put',
                { path: { ref_id: reference }, body },
              ),
            );
        return readData(response, (value) => this.referenceFrom(value));
      },
    );
  }
  private async attachmentResponse(
    attachment: string,
    abort?: AbortSignal,
  ): Promise<HttpResponse<Blob>> {
    const owner = this.editor.contextKey();
    const epoch = this.actor.epoch;
    const path = { ref_id: this.reference, attachment_ref_id: attachment };
    const response = await this.transfer.run(
      this.task
        ? 'download_work_item_attachment_api_v1_work_items__ref_id__attachments__attachment_ref_id__content_get'
        : 'download_attachment_api_v1_business_requests__ref_id__attachments__attachment_ref_id__content_get',
      { path },
      abort,
    );
    if (
      owner !== this.editor.contextKey() ||
      epoch !== this.actor.epoch ||
      abort?.aborted
    ) {
      throw Error('Access or case changed.');
    }
    return response;
  }
  async attachmentContent(
    reference: string,
    abort?: AbortSignal,
  ): Promise<Blob> {
    const response = await this.attachmentResponse(reference, abort);
    if (!response.body) {
      throw Error('Empty download');
    }
    return response.body;
  }
  async downloadAttachment(attachment: string): Promise<void> {
    this.transfer.download(await this.attachmentResponse(attachment));
  }
  cancelTransfer(): void {
    this.transfer.cancel();
  }
}
