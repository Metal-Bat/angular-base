import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { ActorState } from '../../actor-state';
import { BinaryTransfer } from '../../../transport/binary-transfer';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { ImageModule } from 'primeng/image';

/** Private bytes remain in this mounted presenter; no storage URL or browser persistence. */
@Component({
  selector: 'app-private-avatar',
  imports: [LocalizePipe, ImageModule],
  providers: [BinaryTransfer],
  templateUrl: './private-avatar.html',
  styleUrl: './private-avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivateAvatar {
  readonly reference = input<string | null>(null);
  readonly file = input<File | null>(null);
  readonly label = input('Current avatar');
  readonly source = signal('');
  readonly state = signal<'empty' | 'loading' | 'ready' | 'failed'>('empty');
  private readonly transfer = inject(BinaryTransfer);
  private generation = 0;
  private clear(): void {
    this.generation++;
    this.transfer.cancel();
    if (this.source()) {
      URL.revokeObjectURL(this.source());
    }
    this.source.set('');
    this.state.set('empty');
  }
  constructor() {
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      release();
      this.clear();
    });
    effect((cleanup) => {
      const reference = this.reference();
      const file = this.file();
      untracked(() => {
        this.clear();
        if (file) {
          this.show(file);
        } else if (reference) {
          void this.load(reference, this.generation);
        }
      });
      cleanup(() => untracked(() => this.clear()));
    });
  }
  private show(blob: Blob): void {
    // A bounded optional preview does not change the upload/download contract.
    if (!blob.type.startsWith('image/') || blob.size > 10 * 1024 * 1024) {
      this.state.set('failed');
      return;
    }
    this.source.set(URL.createObjectURL(blob));
    this.state.set('ready');
  }
  private async load(reference: string, generation: number): Promise<void> {
    this.state.set('loading');
    try {
      const response = await this.transfer.run(
        'download_image_api_v1_media_images__ref_id__get',
        { path: { ref_id: reference } },
      );
      if (generation === this.generation) {
        if (response.body) {
          this.show(response.body);
        } else {
          this.state.set('failed');
        }
      }
    } catch {
      if (generation === this.generation) {
        this.state.set('failed');
      }
    }
  }
}
