import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ActorState } from '../../../core/auth/actor-state';
import { ApiClient } from '../../../core/transport/api-client';
import { BinaryTransfer } from '../../../core/transport/binary-transfer';
import { record } from '../../../core/transport/api-failure';
import { readData } from '../../../core/transport/response-adapters';
import { Attachment } from '../../forms/application/form-resources';
import { MISSING } from '../../forms/domain/canonical-values';
import {
  fieldSchema,
  indicesFromPath,
  keysAt,
  rowValue,
} from '../../forms/domain/row-values';
import { JsonObject } from '../../forms/domain/runtime-document';
import { EditorPort } from '../application/workspace-ports';
import { stringField } from './workspace-decoders';
export class CaseFiles {
  protected readonly api = inject(ApiClient);
  protected readonly actor = inject(ActorState);
  private readonly transfer = inject(BinaryTransfer);
  readonly transferBusy = this.transfer.busy;
  readonly progress = this.transfer.progress;
  constructor(protected readonly editor: EditorPort) {}
  protected get task(): boolean {
    return this.editor.caseKind() === 'task';
  }
  protected get reference(): string {
    return this.editor.item()?.ref ?? '';
  }
  protected referenceFrom(value: unknown): string {
    const row = record(value);
    const reference =
      row['resource_ref_id'] ??
      row['work_item_ref_id'] ??
      row['request_ref_id'] ??
      row['ref_id'] ??
      row['work_item_ref'];
    if (typeof reference !== 'string') {
      throw Error('Invalid mutation reference');
    }
    return reference;
  }
  protected async flush(): Promise<boolean> {
    return !this.editor.dirty() || (await this.editor.save());
  }
  async collection(
    scope: string,
    path: string,
    operation: 'add' | 'remove' | 'reorder' | 'duplicate',
    key?: string,
    index?: number,
  ): Promise<void> {
    if (!this.editor.canEdit()) {
      return;
    }
    const indices = indicesFromPath(scope, path);
    if (rowValue(this.editor.data(), scope, indices) === MISSING) {
      this.editor.edit({
        scope,
        value: [],
        indices,
        rowKeys: keysAt(this.editor.document()!, scope, indices),
      });
    }
    if (!(await this.flush())) {
      return;
    }
    const schema = fieldSchema(this.editor.document()!, scope)['items'];
    const itemValue =
      (schema as JsonObject | undefined)?.['type'] === 'string' ? '' : {};
    await this.editor.command(
      {
        path,
        operation,
        item_key: key ?? null,
        target_index: index ?? null,
        value: itemValue,
      },
      async (reference, body) => {
        const response = this.task
          ? await firstValueFrom(
              this.api.call(
                'edit_work_item_collection_api_v1_work_items__ref_id__collections_edit_post',
                { path: { ref_id: reference }, body },
              ),
            )
          : await firstValueFrom(
              this.api.call(
                'edit_request_collection_api_v1_business_requests__ref_id__collections_edit_post',
                { path: { ref_id: reference }, body },
              ),
            );
        return readData(response, (value) => this.referenceFrom(value));
      },
    );
  }
  async attachments(): Promise<readonly Attachment[]> {
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
        return {
          ref: stringField(item, 'ref_id'),
          path: stringField(item, 'field_path'),
          caption: String(item['caption'] ?? ''),
          contentType: stringField(item, 'content_type'),
          size: Number(item['size_bytes']),
          position: Number(item['position']),
        };
      });
    });
  }
  private async uploadReference(file: File, image: boolean): Promise<string> {
    const response = await this.transfer.run(
      image
        ? 'upload_image_api_v1_media_images_post'
        : 'upload_file_api_v1_media_files_post',
      { body: { upload: file } },
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
  ): Promise<void> {
    if (!this.editor.canEdit() || !(await this.flush())) {
      return;
    }
    const epoch = this.actor.epoch;
    const owner = this.reference;
    const upload = await this.uploadReference(file, image);
    if (epoch !== this.actor.epoch || owner !== this.reference) {
      throw Error('Access or revision changed. Upload was not linked.');
    }
    await this.editor.command(
      { field_path: path, upload_ref_id: upload, caption: caption || null },
      async (reference, body) => {
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
      },
    );
  }
  async replaceAttachment(
    attachment: string,
    file: File,
    image: boolean,
    caption: string,
  ): Promise<void> {
    if (!this.editor.canEdit() || !(await this.flush())) {
      return;
    }
    const epoch = this.actor.epoch;
    const owner = this.reference;
    const upload = await this.uploadReference(file, image);
    if (epoch !== this.actor.epoch || owner !== this.reference) {
      throw Error('Access or revision changed. Upload was not linked.');
    }
    await this.editor.command(
      { upload_ref_id: upload, caption: caption || null },
      async (reference, body) => {
        const path = { ref_id: reference, attachment_ref_id: attachment };
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
      },
    );
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
  async downloadAttachment(attachment: string): Promise<void> {
    const path = { ref_id: this.reference, attachment_ref_id: attachment };
    this.transfer.download(
      await this.transfer.run(
        this.task
          ? 'download_work_item_attachment_api_v1_work_items__ref_id__attachments__attachment_ref_id__content_get'
          : 'download_attachment_api_v1_business_requests__ref_id__attachments__attachment_ref_id__content_get',
        { path },
      ),
    );
  }
  cancelTransfer(): void {
    this.transfer.cancel();
  }
}
