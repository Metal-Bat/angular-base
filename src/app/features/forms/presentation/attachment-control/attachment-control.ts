import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { Attachment } from '../../application/form-resources';
import { FORM_RESOURCES } from '../../bindings';
import {
  JsonObject,
  RenderNode,
  RuntimeDocument,
} from '../../domain/runtime-document';
@Component({
  selector: 'app-attachment-control',
  imports: [FormsModule, LocalizePipe],
  templateUrl: './attachment-control.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentControl {
  readonly node = input.required<RenderNode>();
  readonly document = input.required<RuntimeDocument>();
  readonly path = input.required<string>();
  readonly writable = input(false);
  readonly busy = input(false);
  readonly resources = inject(FORM_RESOURCES, { optional: true });
  readonly attachments = signal<readonly Attachment[]>([]);
  readonly caption = signal('');
  readonly error = signal('');
  readonly loading = signal(false);
  readonly options = computed(
    () => (this.node().display['options'] as JsonObject | undefined) ?? {},
  );
  readonly accept = computed(() => {
    const types = this.options()['allowed_mime_types'];
    return Array.isArray(types)
      ? types.filter((type) => typeof type === 'string').join(',')
      : '';
  });
  readonly inputId = computed(
    () => 'attachment-' + encodeURIComponent(this.path()),
  );
  private generation = 0;
  constructor() {
    effect((onCleanup) => {
      const reference = this.document().identity.resource;
      const path = this.path();
      let active = true;
      this.attachments.set([]);
      this.error.set('');
      this.loading.set(!!this.resources);
      void this.resources
        ?.attachments()
        .then((items) => {
          if (active && reference === this.document().identity.resource) {
            this.attachments.set(items.filter((item) => item.path === path));
            this.loading.set(false);
          }
        })
        .catch((): void => {
          if (active) {
            this.error.set('The service is unavailable.');
            this.loading.set(false);
          }
        });
      onCleanup((): void => {
        active = false;
        this.generation++;
      });
    });
  }
  async upload(event: Event, replace?: string): Promise<void> {
    const fileControl = event.target as HTMLInputElement;
    const file = fileControl.files?.[0];
    fileControl.value = '';
    if (!file || !this.writable() || !this.resources) {
      return;
    }
    const image = file.type.startsWith('image/');
    if (!this.validFile(file, replace)) {
      this.error.set('This file does not meet the attachment rules');
      return;
    }
    const generation = ++this.generation;
    this.error.set('');
    try {
      if (replace) {
        await this.resources.replaceAttachment(
          replace,
          file,
          image,
          this.caption(),
        );
      } else {
        await this.resources.upload(this.path(), file, image, this.caption());
      }
      if (generation === this.generation) {
        this.caption.set('');
      }
    } catch {
      if (generation === this.generation) {
        this.error.set(
          'Upload failed. Check attachment state before trying again.',
        );
      }
    }
  }
  private validFile(file: File, replace?: string): boolean {
    const options = this.options();
    const allowed = Array.isArray(options['allowed_mime_types'])
      ? options['allowed_mime_types'].filter(
          (type): type is string => typeof type === 'string',
        )
      : [];
    const image = file.type.startsWith('image/');
    return !(
      (typeof options['max_item_bytes'] === 'number' &&
        file.size > options['max_item_bytes']) ||
      (allowed?.length &&
        !allowed.some(
          (type) =>
            type === file.type ||
            (type.endsWith('/*') && file.type.startsWith(type.slice(0, -1))),
        )) ||
      (options['caption_required'] === true && !this.caption().trim()) ||
      (typeof options['max_items'] === 'number' &&
        !replace &&
        this.attachments().length >= options['max_items']) ||
      (typeof options['max_total_bytes'] === 'number' &&
        this.attachments()
          .filter((item) => item.ref !== replace)
          .reduce((sum, item) => sum + item.size, file.size) >
          options['max_total_bytes']) ||
      (Array.isArray(options['allowed_kinds']) &&
        !options['allowed_kinds'].includes(image ? 'image' : 'file'))
    );
  }
  async download(reference: string): Promise<void> {
    try {
      await this.resources?.downloadAttachment(reference);
    } catch {
      this.error.set('Private content is unavailable');
    }
  }
  async remove(reference: string): Promise<void> {
    try {
      await this.resources?.removeAttachment(reference);
    } catch {
      this.error.set('Check attachment state before trying again');
    }
  }
  async move(index: number, offset: number): Promise<void> {
    const items = [...this.attachments()];
    const [entry] = items.splice(index, 1);
    items.splice(index + offset, 0, entry);
    try {
      await this.resources?.reorderAttachments(
        this.path(),
        items.map((item) => item.ref),
      );
    } catch {
      this.error.set('Check attachment state before trying again');
    }
  }
}
