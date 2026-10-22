import { TransferProgress } from '../../../../shared/ui/transfer-progress/transfer-progress';
import { FilePicker } from '../../../../shared/ui/file-picker/file-picker';
import { AttachmentRecovery } from '../attachment-recovery/attachment-recovery';
import {
  AttachmentImage,
  canPreviewAttachment,
} from '../attachment-image/attachment-image';
import { ActorState } from '../../../../core/auth/actor-state';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { Locale } from '../../../../core/localization/locale';
import { nodeLabel } from '../../domain/node-label';
import { nodeDescription } from '../../domain/node-description';
import { attachmentRule } from '../../domain/attachment-rules';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
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
  host: { class: 'console-fragment' },
  selector: 'app-attachment-control',
  imports: [
    AttachmentRecovery,
    AttachmentImage,
    FilePicker,
    TransferProgress,
    ButtonDirective,
    InputTextModule,
    SelectModule,
    FormsModule,
    LocalizePipe,
  ],
  templateUrl: './attachment-control.html',
  styleUrl: './attachment-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttachmentControl {
  readonly node = input.required<RenderNode>();
  readonly document = input.required<RuntimeDocument>();
  readonly path = input.required<string>();
  readonly rows = input<readonly string[]>([]);
  readonly instance = input('');
  readonly writable = input(false);
  readonly busy = input(false);
  readonly resources = inject(FORM_RESOURCES, { optional: true });
  readonly locale = inject(Locale);
  private readonly actor = inject(ActorState);
  readonly label = computed(() => nodeLabel(this.node()));
  readonly description = computed(() => nodeDescription(this.node()));
  readonly supported = computed(
    () => this.node().component === 'attachment_collection',
  );
  readonly readable = computed(() => {
    const scope = this.node().scope;
    return (
      !!scope &&
      (this.node().display['runtime_state'] as JsonObject | undefined)?.[
        'visible'
      ] !== false &&
      this.document().policy.readable.some(
        (parent) => scope === parent || scope.startsWith(parent + '/'),
      )
    );
  });
  readonly owner = computed(() =>
    JSON.stringify([
      this.resources?.ownerKey() ?? '',
      this.node().scope,
      this.rows(),
    ]),
  );
  readonly attachments = linkedSignal({
    source: this.owner,
    computation: (): readonly Attachment[] => [],
  });
  readonly caption = linkedSignal({
    source: this.owner,
    computation: () => '',
  });
  readonly error = linkedSignal({ source: this.owner, computation: () => '' });
  readonly preview = linkedSignal({
    source: this.owner,
    computation: () => '',
  });
  readonly accessLost = linkedSignal({
    source: this.owner,
    computation: () => false,
  });
  readonly loading = signal(false);
  readonly working = signal(false);
  readonly options = computed(
    () => (this.node().display['options'] as JsonObject | undefined) ?? {},
  );
  readonly kinds = computed(() => {
    const allowed = this.options()['allowed_kinds'];
    return (['file', 'image'] as const)
      .filter(
        (kind) =>
          !Array.isArray(allowed) || !allowed.length || allowed.includes(kind),
      )
      .map((value) => ({
        value,
        label: this.locale.text(value === 'image' ? 'Image' : 'File'),
      }));
  });
  readonly kind = linkedSignal<string, 'file' | 'image'>({
    source: () =>
      JSON.stringify([this.owner(), this.kinds().map((item) => item.value)]),
    computation: (source, previous) =>
      previous?.source === source
        ? previous.value
        : untracked(() => this.kinds()[0]?.value ?? 'file'),
  });
  readonly capture = computed(() =>
    this.kind() === 'image' && this.options()['camera'] === true
      ? ('environment' as const)
      : null,
  );
  readonly accept = computed(() => {
    if (this.kind() === 'image') {
      return 'image/*';
    }
    const types = this.options()['allowed_mime_types'];
    return Array.isArray(types)
      ? types.filter((type) => typeof type === 'string').join(',')
      : '';
  });
  readonly ruleSummary = computed(() => {
    const options = this.options();
    const values = [this.accept()];
    for (const [key, label] of [
      ['max_item_bytes', 'bytes per file'],
      ['max_total_bytes', 'bytes in total'],
      ['max_items', 'attachments maximum'],
    ]) {
      const value = options[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        values.push(this.locale.number(value) + ' ' + this.locale.text(label));
      }
    }
    return values.filter(Boolean).join(' · ');
  });
  readonly inputId = computed(
    () =>
      'attachment-' +
      encodeURIComponent(this.path()) +
      (this.instance() ? '--' + encodeURIComponent(this.instance()) : ''),
  );
  readonly disabled = computed(
    () =>
      !this.writable() ||
      !this.supported() ||
      !this.readable() ||
      this.accessLost() ||
      this.busy() ||
      this.working() ||
      this.loading() ||
      !this.resources ||
      this.resources.transferBusy() ||
      !!this.resources.pendingAttachment(),
  );
  private generation = 0;
  private abort: AbortController | null = null;
  constructor() {
    const release = this.actor.register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      release();
      this.clear();
    });
    effect((cleanup) => {
      this.owner();
      cleanup(() => untracked(() => this.clear()));
    });
    effect((cleanup) => {
      this.owner();
      const reference = this.document().identity.resource;
      const path = this.path();
      const readable = this.readable() && this.supported();
      const epoch = this.actor.epoch;
      let active = true;
      untracked(() => {
        if (!readable) {
          this.clear();
          return;
        }
        this.error.set('');
        this.loading.set(!!this.resources);
        void this.resources
          ?.attachments()
          .then((items) => {
            if (
              active &&
              epoch === this.actor.epoch &&
              reference === this.document().identity.resource
            ) {
              const current = items.filter((item) => item.path === path);
              this.attachments.set(current);
              if (!current.some((item) => item.ref === this.preview())) {
                this.preview.set('');
              }
              this.accessLost.set(false);
              this.loading.set(false);
            }
          })
          .catch((failure: unknown): void => {
            if (active && epoch === this.actor.epoch) {
              if (
                failure instanceof ApiFailure &&
                [403, 404].includes(failure.httpStatus)
              ) {
                this.clear();
                this.accessLost.set(true);
              }
              this.error.set('Private content is unavailable');
              this.loading.set(false);
            }
          });
      });
      cleanup(() => {
        active = false;
      });
    });
  }
  private clear(): void {
    this.generation++;
    this.abort?.abort();
    this.abort = null;
    this.attachments.set([]);
    this.caption.set('');
    this.preview.set('');
    this.error.set('');
    this.loading.set(false);
    this.working.set(false);
  }
  setKind(value: 'file' | 'image'): void {
    if (!this.disabled() && this.kinds().some((item) => item.value === value)) {
      this.kind.set(value);
    }
  }
  canPreview(item: Attachment): boolean {
    return (
      this.readable() &&
      !this.accessLost() &&
      this.options()['preview'] !== false &&
      canPreviewAttachment(item)
    );
  }
  async uploadFile(file: File, replacement?: string): Promise<void> {
    if (
      this.disabled() ||
      !this.resources ||
      (replacement &&
        (this.options()['allow_replace'] !== true ||
          !this.attachments().some((item) => item.ref === replacement)))
    ) {
      return;
    }
    const issue = attachmentRule(
      file,
      this.kind(),
      this.caption(),
      this.attachments(),
      this.options(),
      replacement,
    );
    if (issue) {
      this.error.set(issue);
      return;
    }
    const generation = this.generation;
    const abort = new AbortController();
    this.abort = abort;
    this.working.set(true);
    this.error.set('');
    try {
      if (replacement) {
        await this.resources.replaceAttachment(
          replacement,
          file,
          this.kind() === 'image',
          this.caption(),
          abort.signal,
        );
      } else {
        await this.resources.upload(
          this.path(),
          file,
          this.kind() === 'image',
          this.caption(),
          abort.signal,
        );
      }
      if (generation === this.generation) {
        this.caption.set('');
      }
    } catch {
      if (generation === this.generation) {
        this.error.set(
          this.resources.pendingAttachment()
            ? 'The file is uploaded. Its attachment link is not yet confirmed.'
            : 'Upload failed. Check attachment state before trying again.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.working.set(false);
        this.abort = null;
      }
    }
  }
  cancel(): void {
    this.abort?.abort();
  }
  async download(reference: string): Promise<void> {
    if (
      !this.readable() ||
      this.accessLost() ||
      this.resources?.transferBusy()
    ) {
      return;
    }
    const generation = this.generation;
    try {
      await this.resources?.downloadAttachment(reference);
    } catch {
      if (generation === this.generation) {
        this.error.set('Private content is unavailable');
      }
    }
  }
  async remove(reference: string): Promise<void> {
    if (this.disabled() || this.options()['allow_remove'] === false) {
      return;
    }
    const generation = this.generation;
    try {
      await this.resources?.removeAttachment(reference);
    } catch {
      if (generation === this.generation) {
        this.error.set('Check attachment state before trying again');
      }
    }
  }
  async move(index: number, offset: number): Promise<void> {
    if (
      this.disabled() ||
      this.options()['allow_reorder'] !== true ||
      !Number.isSafeInteger(index) ||
      ![-1, 1].includes(offset) ||
      index < 0 ||
      index >= this.attachments().length ||
      index + offset < 0 ||
      index + offset >= this.attachments().length
    ) {
      return;
    }
    const generation = this.generation;
    const items = [...this.attachments()];
    const [entry] = items.splice(index, 1);
    items.splice(index + offset, 0, entry);
    try {
      await this.resources?.reorderAttachments(
        this.path(),
        items.map((item) => item.ref),
      );
    } catch {
      if (generation === this.generation) {
        this.error.set('Check attachment state before trying again');
      }
    }
  }
}
