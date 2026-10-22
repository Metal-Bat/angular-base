import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { ImageModule } from 'primeng/image';
import { ActorState } from '../../../../core/auth/actor-state';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { Attachment } from '../../application/form-resources';
import { FORM_RESOURCES } from '../../bindings';

const maximumPreviewBytes = 10 * 1024 * 1024;
const previewTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif',
]);
export function canPreviewAttachment(item: Attachment): boolean {
  return (
    item.kind === 'image' &&
    previewTypes.has(item.contentType) &&
    Number.isSafeInteger(item.size) &&
    item.size > 0 &&
    item.size <= maximumPreviewBytes
  );
}
@Component({
  selector: 'app-attachment-image',
  imports: [ImageModule, LocalizePipe],
  templateUrl: './attachment-image.html',
  styleUrl: './attachment-image.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentImage {
  readonly attachment = input.required<Attachment>();
  readonly owner = input.required<string>();
  readonly source = signal('');
  readonly state = signal<'loading' | 'ready' | 'failed'>('loading');
  private readonly identity = computed(() => {
    const item = this.attachment();
    return JSON.stringify([
      this.owner(),
      item.ref,
      item.kind,
      item.contentType,
      item.size,
    ]);
  });
  private readonly resources = inject(FORM_RESOURCES);
  private abort: AbortController | null = null;
  private generation = 0;
  constructor() {
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      release();
      this.clear();
    });
    effect((cleanup) => {
      this.identity();
      untracked(() => {
        const attachment = this.attachment();
        this.clear();
        if (canPreviewAttachment(attachment)) {
          this.abort = new AbortController();
          this.state.set('loading');
          void this.load(attachment, this.abort.signal, this.generation);
        }
      });
      cleanup(() => untracked(() => this.clear()));
    });
  }
  private clear(): void {
    this.generation++;
    this.abort?.abort();
    this.abort = null;
    if (this.source()) {
      URL.revokeObjectURL(this.source());
    }
    this.source.set('');
    this.state.set('failed');
  }
  failed(): void {
    this.clear();
  }
  private async load(
    item: Attachment,
    abort: AbortSignal,
    generation: number,
  ): Promise<void> {
    try {
      const blob = await this.resources.attachmentContent(item.ref, abort);
      if (generation !== this.generation || abort.aborted) {
        return;
      }
      if (
        !previewTypes.has(blob.type) ||
        !blob.size ||
        blob.size > maximumPreviewBytes
      ) {
        this.state.set('failed');
        return;
      }
      this.source.set(URL.createObjectURL(blob));
      this.state.set('ready');
    } catch {
      if (generation === this.generation) {
        this.state.set('failed');
      }
    }
  }
}
