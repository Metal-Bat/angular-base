import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { parseDocument } from '../../domain/authoring';
import { STUDIO_API } from '../../bindings';
@Component({
  selector: 'app-library-tools',
  imports: [FormsModule, RouterLink, LocalizePipe],
  templateUrl: './library-tools.html',
  styleUrl: './library-tools.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryTools {
  private readonly api = inject(STUDIO_API);
  private readonly feedback = inject(Feedback);
  readonly items = signal<readonly JsonObject[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly result = signal('');
  readonly upgradeReady = signal(false);
  search = '';
  kind = 'component';
  reference = '';
  otherReference = '';
  formReference = '';
  templateKind = 'form';
  templateCode = '';
  templateName = '';
  templateMode = 'COPY';
  upgrades = '{"targets":[]}';
  private previewPayload = '';
  private generation = 0;
  constructor() {
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
    void this.load();
  }
  private clear(): void {
    this.generation++;
    this.items.set([]);
    this.search = '';
    this.templateCode = '';
    this.templateName = '';
    this.busy.set(false);
    this.error.set('');
    this.reference = '';
    this.otherReference = '';
    this.formReference = '';
    this.result.set('');
    this.previewPayload = '';
    this.upgrades = '';
    this.upgradeReady.set(false);
  }
  async load(page = 1, selection = false): Promise<void> {
    await this.run(async (generation) => {
      const value = await this.api.auxiliary(
        selection ? 'selection' : 'library',
        {
          page,
          size: 20,
          kind: this.kind,
          locale: 'en',
          capabilities: [],
          ...(this.search ? { search: this.search } : {}),
        },
      );
      if (generation !== this.generation) {
        return;
      }
      if (Array.isArray(value)) {
        this.items.set(value as JsonObject[]);
        this.totalPages.set(1);
      } else {
        const result = value as { items: JsonObject[]; totalPages: number };
        this.items.set(result.items);
        this.totalPages.set(result.totalPages);
      }
      this.page.set(page);
    });
  }
  readonly usagePage = signal(1);
  readonly usagePages = signal(0);
  async inspect(tool: string, page = 1): Promise<void> {
    if (!this.reference && tool !== 'explanation') {
      return;
    }
    await this.run(async (generation) => {
      const body: JsonObject | undefined =
        tool === 'compare'
          ? { other_ref_id: this.otherReference }
          : tool === 'usage'
            ? { page, size: 20 }
            : undefined;
      const path: Record<string, string> =
        tool === 'explanation'
          ? { ref_id: this.formReference }
          : { kind: this.kind, ref_id: this.reference };
      const result = await this.api.auxiliary(tool, body, path);
      if (generation === this.generation && tool === 'usage') {
        this.usagePage.set(page);
        this.usagePages.set((result as { totalPages: number }).totalPages);
      }
      if (generation === this.generation) {
        this.result.set(JSON.stringify(result, null, 2));
      }
    });
  }
  async createTemplate(): Promise<void> {
    if (
      !(await this.feedback.confirm(
        'Create an explicit template draft from this exact source version?',
      ))
    ) {
      return;
    }
    await this.run(async (generation) => {
      const result = await this.api.auxiliary('template', {
        kind: this.templateKind,
        source_ref_id: this.reference,
        code: this.templateCode,
        name: this.templateName,
        mode: this.templateMode,
      });
      if (generation === this.generation) {
        this.result.set(JSON.stringify(result, null, 2));
      }
    });
  }
  changed(value: string): void {
    this.upgrades = value;
    this.upgradeReady.set(false);
    this.previewPayload = '';
  }
  async previewUpgrade(): Promise<void> {
    await this.run(async (generation) => {
      const body = parseDocument(this.upgrades);
      const payload = JSON.stringify(body);
      const result = await this.api.auxiliary('upgradePreview', body);
      if (generation !== this.generation) {
        return;
      }
      this.result.set(JSON.stringify(result, null, 2));
      this.previewPayload = payload;
      this.upgradeReady.set(
        (result as { compatible?: boolean }).compatible === true,
      );
    });
  }
  async applyUpgrade(): Promise<void> {
    if (
      !this.upgradeReady() ||
      this.previewPayload !== JSON.stringify(parseDocument(this.upgrades)) ||
      !(await this.feedback.confirm(
        'Apply the reviewed exact-version upgrade? Published consumers remain immutable; stale targets are rejected.',
      ))
    ) {
      return;
    }
    await this.run(async (generation) => {
      const result = await this.api.auxiliary(
        'upgradeApply',
        parseDocument(this.previewPayload),
      );
      if (generation !== this.generation) {
        return;
      }
      this.result.set(JSON.stringify(result, null, 2));
      this.upgradeReady.set(false);
      this.previewPayload = '';
    });
  }
  ref(item: JsonObject): string {
    return String(item['version_ref_id'] ?? item['ref_id'] ?? item['key']);
  }
  label(item: JsonObject): string {
    return String(
      item['name'] ?? item['title'] ?? item['value'] ?? item['code'],
    );
  }
  choose(item: JsonObject): void {
    this.reference = this.ref(item);
    if (typeof item['kind'] === 'string') {
      this.kind = item['kind'];
    }
    this.result.set(JSON.stringify(item, null, 2));
  }
  private async run(
    work: (generation: number) => Promise<void>,
  ): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const generation = this.generation;
    try {
      await work(generation);
    } catch {
      if (generation === this.generation) {
        this.error.set(
          'The library operation failed. Review source access, exact pins and current revisions before retrying.',
        );
        this.upgradeReady.set(false);
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
