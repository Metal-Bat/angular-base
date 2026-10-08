import { ButtonDirective } from 'primeng/button';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BinaryTransfer } from '../../../../core/transport/binary-transfer';
import { readData } from '../../../../core/transport/response-adapters';
import { record } from '../../../../core/transport/api-failure';
import { ActorState } from '../../../../core/auth/actor-state';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
@Component({
  host: { class: 'console-page' },
  selector: 'app-generic-media',
  providers: [BinaryTransfer],
  imports: [ButtonDirective, RouterLink, LocalizePipe],
  templateUrl: './generic-media.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericMedia {
  readonly transfer = inject(BinaryTransfer);
  readonly upload = signal<{
    reference: string;
    name: string;
    image: boolean;
  } | null>(null);
  readonly error = signal('');
  private generation = 0;
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.upload.set(null);
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      release();
    });
  }
  async pick(event: Event): Promise<void> {
    const control = event.target as HTMLInputElement;
    const file = control.files?.[0];
    control.value = '';
    if (!file || this.transfer.busy()) {
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.error.set('File exceeds the upload limit');
      return;
    }
    const generation = ++this.generation;
    this.upload.set(null);
    this.error.set('');
    const image = file.type.startsWith('image/');
    try {
      const response = await this.transfer.run(
        image
          ? 'upload_image_api_v1_media_images_post'
          : 'upload_file_api_v1_media_files_post',
        { body: { upload: file } },
      );
      const body: unknown = JSON.parse(await response.body!.text());
      const reference = readData(response.clone({ body }), (raw) => {
        const ref = record(raw)['ref_id'];
        if (typeof ref !== 'string') {
          throw Error('Invalid upload');
        }
        return ref;
      });
      if (generation === this.generation) {
        this.upload.set({ reference, name: file.name, image });
      }
    } catch {
      if (generation === this.generation) {
        this.error.set('Upload failed.');
      }
    }
  }
  async download(): Promise<void> {
    const upload = this.upload();
    if (!upload) {
      return;
    }
    try {
      this.transfer.download(
        await this.transfer.run(
          upload.image
            ? 'download_image_api_v1_media_images__ref_id__get'
            : 'download_file_api_v1_media_files__ref_id__get',
          { path: { ref_id: upload.reference } },
        ),
      );
    } catch {
      this.error.set('Private content is unavailable');
    }
  }
}
