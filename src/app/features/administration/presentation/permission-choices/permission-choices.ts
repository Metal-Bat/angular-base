import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ActorState } from '../../../../core/auth/actor-state';
import { SessionContext } from '../../../../core/auth/session-context';
import { hasPermissions } from '../../../../core/permissions/area-access';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { Locale } from '../../../../core/localization/locale';
import { ADMIN_API } from '../../bindings';
@Component({
  selector: 'app-permission-choices',
  host: { class: 'col-span-full min-w-0' },
  imports: [FormsModule, ButtonModule, InputTextModule, LocalizePipe],
  templateUrl: './permission-choices.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionChoices {
  private readonly api = inject(ADMIN_API, { optional: true });
  private readonly actor = inject(SessionContext);
  private readonly locale = inject(Locale);
  readonly value = input<readonly string[]>([]);
  readonly selected = linkedSignal(() => this.value());
  readonly valueChange = output<string[]>();
  readonly controlId = input.required<string>();
  readonly disabled = input(false);
  readonly error = input('');
  readonly rows = signal<readonly { name: string; description: string }[]>([]);
  readonly search = signal('');
  readonly busy = signal(false);
  readonly failure = signal('');
  readonly page = signal(1);
  readonly pages = signal(0);
  private generation = 0;
  private abort = new AbortController();
  readonly groups = computed(() =>
    [...new Set(this.rows().map((row) => row.name.split('.')[0]))].map(
      (key) => ({
        key,
        rows: this.rows().filter((row) => row.name.split('.')[0] === key),
      }),
    ),
  );
  constructor() {
    const release = inject(ActorState).register(() => {
      this.clear();
      this.selected.set([]);
    });
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
    effect(() => {
      this.locale.language();
      this.disabled();
      untracked(() => {
        this.clear();
        if (!this.disabled()) {
          void this.load();
        }
      });
    });
  }
  private clear(): void {
    this.generation++;
    this.abort.abort();
    this.abort = new AbortController();
    this.rows.set([]);
    this.busy.set(false);
    this.failure.set('');
    this.search.set('');
    this.page.set(1);
    this.pages.set(0);
  }
  toggle(name: string): void {
    if (this.disabled() || this.busy()) {
      return;
    }
    const next = this.selected().includes(name)
      ? this.selected().filter((key) => key !== name)
      : [...this.selected(), name];
    this.selected.set(next);
    this.valueChange.emit([...next]);
  }
  async load(page = 1): Promise<void> {
    if (this.disabled() || this.busy()) {
      return;
    }
    const actor = this.actor.snapshot();
    const command = this.api
      ?.commands('permissions')
      .find((row) => row.path === '/api/v1/admin/permissions/search');
    if (
      !command ||
      actor.status !== 'authenticated' ||
      !hasPermissions(actor.permissions, [command.permission])
    ) {
      this.failure.set(
        'Permission choices are unavailable. Existing selections are retained.',
      );
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    this.failure.set('');
    try {
      const result = await this.api!.send(
        command,
        {
          path: {},
          query: {},
          body: {
            page,
            size: 20,
            filters: [
              { field_name: 'deleted_at', operation: 'isNull', value: null },
              ...(this.search().trim()
                ? [
                    {
                      field_name: 'name',
                      operation: 'contains',
                      value: this.search().trim().slice(0, 255),
                    },
                  ]
                : []),
            ],
            sort_orders: [{ field_name: 'name', operation: 'asc' }],
          },
        },
        this.abort.signal,
      );
      if (generation !== this.generation) {
        return;
      }
      if (!Array.isArray(result.value) || result.value.length > 20) {
        throw Error('Invalid permissions');
      }
      const rows = result.value.map((value) => {
        if (
          !value ||
          typeof value !== 'object' ||
          Array.isArray(value) ||
          typeof value['name'] !== 'string' ||
          !value['name']
        ) {
          throw Error('Invalid permissions');
        }
        return {
          name: value['name'],
          description:
            typeof value['description'] === 'string'
              ? value['description']
              : '',
        };
      });
      this.rows.set(rows);
      this.page.set(result.page);
      this.pages.set(result.totalPages);
    } catch {
      if (generation === this.generation) {
        this.failure.set(
          'Permission search failed. Existing selections are retained.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
