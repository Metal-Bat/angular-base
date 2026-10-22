import {
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
} from '@angular/core';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { Locale } from '../../../../core/localization/locale';
import { ResourceLinks } from '../../../../core/resources/resource-links';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { JsonObject } from '../../../../shared/domain/json-value';
import { STUDIO_API } from '../../bindings';
import { accessStateObserved, GrantRow } from '../../domain/catalog-access';
import type { ResourceCatalog } from './resource-catalog';
@Directive()
export abstract class CatalogAccessState {
  readonly view =
    input.required<
      Pick<
        ResourceCatalog,
        | 'busy'
        | 'dirty'
        | 'reconcileRequired'
        | 'reference'
        | 'selected'
        | 'spec'
        | 'key'
        | 'command'
        | 'error'
        | 'refreshAccessOwner'
      >
    >();
  readonly visible = signal(false);
  readonly loading = signal(false);
  readonly rows = signal<readonly GrantRow[]>([]);
  readonly page = signal(1);
  readonly pages = signal(0);
  readonly error = signal('');
  readonly notice = signal('');
  readonly uncertain = signal(false);
  protected pendingChange: { body?: JsonObject; ref?: string } | null = null;
  kind: 'users' | 'work_groups' = 'users';
  target = '';
  viewPermission = true;
  startPermission = false;
  private generation = 0;
  protected readonly actor = inject(ActorState);
  protected readonly api = inject(STUDIO_API);
  private readonly injector = inject(Injector);
  protected readonly feedback = inject(Feedback);
  protected readonly locale = inject(Locale);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  constructor() {
    let owner = '';
    effect(() => {
      const reference = this.view().reference();
      if (reference !== owner) {
        owner = reference;
        this.reset();
      }
    });
    const release = this.actor.register(() => this.reset());
    inject(DestroyRef).onDestroy(() => {
      this.reset();
      release();
    });
  }
  private reset(): void {
    this.generation++;
    this.visible.set(false);
    this.loading.set(false);
    this.rows.set([]);
    this.error.set('');
    this.page.set(1);
    this.pages.set(0);
    this.notice.set('');
    this.uncertain.set(false);
    this.pendingChange = null;
    this.kind = 'users';
    this.clearDraft();
  }
  protected clearDraft(): void {
    this.target = '';
    this.viewPermission = true;
    this.startPermission = false;
  }
  blocked(): boolean {
    const vm = this.view();
    return vm.busy() || vm.dirty() || this.loading();
  }
  pending(): boolean {
    return !!this.target || !this.viewPermission || this.startPermission;
  }
  mutationsBlocked(): boolean {
    return (
      this.blocked() || this.view().reconcileRequired() || this.uncertain()
    );
  }
  async canLeave(): Promise<boolean> {
    if (!this.visible() || !this.view().reference()) {
      return true;
    }
    return (
      !this.blocked() &&
      (!this.pending() ||
        this.feedback.confirm('Discard unsaved access changes?'))
    );
  }
  async open(): Promise<void> {
    if (this.blocked() || !this.view().reference()) {
      return;
    }
    this.visible.set(true);
    if (this.view().spec.actions.includes('grants')) {
      await this.load();
    }
  }
  async close(): Promise<void> {
    if (await this.canLeave()) {
      this.visible.set(false);
      this.clearDraft();
    }
  }
  escape(event: Event): void {
    if (!event.defaultPrevented) {
      event.preventDefault();
      event.stopPropagation();
      void this.close();
    }
  }
  restoreFocus(): void {
    const trigger = this.host.nativeElement.querySelector<HTMLButtonElement>(
      '[data-catalog-access]',
    );
    if (trigger?.isConnected && trigger.getClientRects().length) {
      trigger.focus();
    }
  }
  setKind(kind: 'users' | 'work_groups'): void {
    this.kind = kind;
    this.target = '';
  }
  protected current(reference: string, epoch: number): boolean {
    return (
      this.visible() &&
      reference === this.view().reference() &&
      epoch === this.actor.epoch
    );
  }
  async refresh(): Promise<void> {
    if (this.blocked()) {
      return;
    }
    const reference = this.view().reference();
    const epoch = this.actor.epoch;
    await this.view().refreshAccessOwner();
    if (this.current(reference, epoch) && !this.view().reconcileRequired()) {
      if (this.view().spec.actions.includes('grants')) {
        await this.load(this.page());
      }
    }
  }
  async load(page = 1): Promise<void> {
    const vm = this.view();
    if (this.blocked() || !vm.spec.actions.includes('grants')) {
      return;
    }
    const generation = ++this.generation;
    const reference = vm.reference();
    const epoch = this.actor.epoch;
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.api.action(vm.key, reference, 'grants', {
        page,
        size: 20,
        filters: [],
        sort_orders: [],
      });
      if (!Array.isArray(result['items'])) {
        throw Error('Invalid grant page');
      }
      const raw = result['items'] as JsonObject[];
      if (raw.length > 20) {
        throw Error('Unbounded grant page');
      }
      const rows = await this.namedRows(raw);
      if (generation === this.generation && this.current(reference, epoch)) {
        this.rows.set(rows);
        this.page.set(Number(result['page']));
        this.pages.set(Number(result['total_pages']));
        if (
          this.pendingChange &&
          accessStateObserved(raw, this.pages(), this.pendingChange)
        ) {
          this.uncertain.set(false);
          this.pendingChange = null;
          this.clearDraft();
          this.notice.set('Requested access state is confirmed.');
        }
      }
    } catch (error) {
      if (generation === this.generation && this.current(reference, epoch)) {
        this.rows.set([]);
        this.error.set(
          error instanceof ApiFailure
            ? error.message
            : 'Access entries could not be loaded.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.loading.set(false);
      }
    }
  }
  private async namedRows(raw: JsonObject[]): Promise<GrantRow[]> {
    const references = raw.map((row) => {
      const user = row['user_ref_id'];
      const group = row['work_group_ref_id'];
      if (
        typeof row['ref_id'] !== 'string' ||
        !!user === !!group ||
        (user !== null && typeof user !== 'string') ||
        (group !== null && typeof group !== 'string') ||
        (this.view().key === 'workflows' &&
          (typeof row['can_view'] !== 'boolean' ||
            typeof row['can_start'] !== 'boolean'))
      ) {
        throw Error('Invalid grant recipient');
      }
      return user
        ? { kind: 'users' as const, ref_id: String(user) }
        : { kind: 'work_groups' as const, ref_id: String(group) };
    });
    let labels: readonly string[] = [];
    if (references.length) {
      try {
        labels = (
          await this.injector.get(ResourceLinks).selected(references)
        ).map((item) => item.label);
      } catch {
        /* Missing authority never falls back to opaque recipient references. */
      }
    }
    return raw.map((row, index) => ({
      ref: String(row['ref_id']),
      recipient: labels[index] ?? this.locale.text('Recipient unavailable'),
      named: !!labels[index],
      view: row['can_view'] === true,
      start: row['can_start'] === true,
      use: row['can_use'] === true,
    }));
  }
}
