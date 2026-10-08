import { emptyQuery } from '../../../../shared/domain/list-query';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { DialogModule } from 'primeng/dialog';
import { Locale } from '../../../../core/localization/locale';
import { RecordTable } from '../../../../shared/ui/record-table/record-table';
import { ButtonDirective } from 'primeng/button';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
  host: { class: 'console-page' },
  selector: 'app-library-tools',
  imports: [
    SelectControl,
    DialogModule,
    RecordTable,
    ButtonDirective,
    FormsModule,
    RouterLink,
    LocalizePipe,
  ],
  templateUrl: './library-tools.html',
  styleUrl: './library-tools.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryTools {
  private readonly api = inject(STUDIO_API);
  private readonly actor = inject(ActorState);
  private readonly locale = inject(Locale);
  readonly templateOpen = signal(false);
  readonly selectedName = signal('');
  readonly tableQuery = computed(() => ({
    ...emptyQuery(),
    size: Number(this.appliedQuery()?.['size'] ?? 20),
  }));
  readonly appliedQuery = signal<JsonObject | null>(null);
  private readonly feedback = inject(Feedback);
  readonly selection = signal(false);
  readonly columns = computed(() =>
    this.selection()
      ? [{ key: 'value', label: 'Name' }]
      : [
          { key: 'code', label: 'Code' },
          { key: 'title', label: 'Name' },
          { key: 'number', label: 'Version' },
          { key: 'status', label: 'Status' },
        ],
  );
  readonly items = signal<readonly JsonObject[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
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
    const release = this.actor.register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
    void this.load();
  }
  private clear(): void {
    this.generation++;
    this.templateOpen.set(false);
    this.selectedName.set('');
    this.appliedQuery.set(null);
    this.items.set([]);
    this.selection.set(false);
    this.search = '';
    this.templateCode = '';
    this.templateName = '';
    this.busy.set(false);
    this.error.set('');
    this.notice.set('');
    this.reference = '';
    this.otherReference = '';
    this.formReference = '';
    this.result.set('');
    this.previewPayload = '';
    this.upgrades = '';
    this.upgradeReady.set(false);
  }
  async load(
    page = 1,
    selection = this.selection(),
    apply = false,
    size?: number,
  ): Promise<void> {
    await this.run(async (generation) => {
      const query: JsonObject =
        !apply && this.appliedQuery()
          ? { ...this.appliedQuery()!, page, ...(size ? { size } : {}) }
          : {
              page,
              size: size ?? 20,
              kind: this.kind,
              locale: this.locale.contentLanguage(),
              capabilities: [],
              ...(this.search ? { search: this.search } : {}),
            };
      const value = await this.api.auxiliary(
        selection ? 'selection' : 'library',
        query,
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
      this.appliedQuery.set(structuredClone(query));
      this.selection.set(selection);
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
  closeTemplate(): void {
    if (this.busy()) {
      return;
    }
    this.templateOpen.set(false);
    this.templateCode = '';
    this.templateName = '';
  }
  async createTemplate(): Promise<void> {
    const epoch = this.actor.epoch;
    const body: JsonObject = {
      kind: this.templateKind,
      source_ref_id: this.reference,
      code: this.templateCode,
      name: this.templateName,
      mode: this.templateMode,
    };
    if (
      !(await this.feedback.confirm(
        'Create an explicit template draft from this exact source version?',
      ))
    ) {
      return;
    }
    if (epoch !== this.actor.epoch) {
      return;
    }
    await this.run(async (generation) => {
      const result = await this.api.auxiliary('template', body);
      if (generation === this.generation) {
        this.notice.set('Template draft created.');
        this.templateOpen.set(false);
        this.templateCode = '';
        this.templateName = '';
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
    this.selectedName.set(this.label(item));
    const kind = item['kind'] ?? this.appliedQuery()?.['kind'];
    if (typeof kind === 'string') {
      this.kind = kind;
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
