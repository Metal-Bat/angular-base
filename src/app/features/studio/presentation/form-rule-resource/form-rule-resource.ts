import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Locale } from '../../../../core/localization/locale';
import { ActorState } from '../../../../core/auth/actor-state';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import {
  decodeChoice,
  encodeChoice,
} from '../../../forms/domain/canonical-values';
import {
  OptionCoordinator,
  OptionPage,
} from '../../../forms/domain/option-coordinator';
import { OutlineItem } from '../../domain/form-authoring';
import { inspectionQuery, scopeRowCount } from '../../domain/form-inspection';
import { STUDIO_API } from '../../bindings';
import { parseNumberText } from '../../../../shared/domain/number-text';
@Component({
  selector: 'app-form-rule-resource',
  imports: [
    FormsModule,
    ButtonDirective,
    InputTextModule,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './form-rule-resource.html',
  styleUrl: './form-rule-resource.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormRuleResource {
  readonly documents = input.required<JsonObject>();
  readonly uiLocale = inject(Locale);
  readonly field = input.required<OutlineItem>();
  readonly data = input<JsonObject>({});
  readonly locale = input('en');
  readonly disabled = input(false);
  readonly nullable = input(false);
  readonly summaryOnly = input(false);
  readonly summaryValue = input<JsonValue>();
  readonly controlId = input('rule-resource-value');
  readonly picked = output<{ value: JsonValue; label: string }>();
  readonly validChange = output<boolean>();
  readonly page = signal(1);
  readonly search = signal('');
  readonly positions = signal<string[]>([]);
  readonly result = signal<OptionPage | null>(null);
  readonly selected = signal('');
  readonly busy = signal(false);
  readonly error = signal('');
  private readonly api = inject(STUDIO_API, { optional: true });
  private readonly actor = inject(ActorState);
  private sequence = 0;
  private confirmedContext: () => boolean = () => false;
  private timer?: ReturnType<typeof setTimeout>;
  private readonly coordinator = new OptionCoordinator(
    (request, generation, abort) => {
      if (!this.api) {
        throw Error('Option service unavailable');
      }
      return this.api.options(
        this.documents(),
        '/root' +
          this.field()
            .path.map((i) => '/children/' + i)
            .join(''),
        request,
        generation,
        abort,
      );
    },
  );
  readonly summary = computed(() => {
    if (this.busy()) {
      return 'Loading…';
    }
    const value = this.summaryValue();
    if (value === null) {
      return 'No value';
    }
    if (typeof value === 'object') {
      return 'Existing structured value';
    }
    try {
      const key = encodeChoice(value!);
      return (
        this.result()?.items.find((item) => item.key === key)?.value ??
        'Selection unavailable'
      );
    } catch {
      return 'Selection unavailable';
    }
  });
  readonly status = computed(() =>
    this.busy()
      ? 'Loading…'
      : this.error() ||
        (this.result()?.state === 'BLOCKED'
          ? 'Complete the dependent fields first'
          : this.result()?.state === 'CLIENT_FETCH'
            ? 'This source requires runtime fetching.'
            : this.result()?.state === 'EMPTY'
              ? 'No options'
              : ''),
  );
  constructor() {
    effect(() => {
      this.documents();
      this.field();
      this.data();
      this.locale();
      this.summaryValue();
      this.summaryOnly();
      untracked(() => {
        this.clear();
        this.positions.set(
          Array.from(
            { length: scopeRowCount(this.field().scope ?? '') },
            () => '',
          ),
        );
        if (!(this.summaryOnly() && this.summaryValue() === null)) {
          void this.load();
        }
      });
    });
    const release = this.actor.register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear(false);
      release();
    });
  }
  private clear(notify = true): void {
    this.confirmedContext = (): boolean => false;
    this.sequence++;
    clearTimeout(this.timer);
    this.coordinator.reset();
    this.result.set(null);
    this.selected.set('');
    this.search.set('');
    this.page.set(1);
    this.positions.set([]);
    this.busy.set(false);
    this.error.set('');
    if (notify && !this.summaryOnly()) {
      this.validChange.emit(false);
    }
  }
  searchFor(value: string): void {
    if (this.disabled()) {
      return;
    }
    this.search.set(value);
    this.page.set(1);
    this.invalidate();
    this.timer = setTimeout(() => void this.load(), 250);
  }
  position(index: number, value: string): void {
    if (this.disabled()) {
      return;
    }
    this.positions.update((rows) =>
      rows.map((row, i) => (i === index ? value : row)),
    );
    this.invalidate();
  }
  private invalidate(): void {
    this.confirmedContext = (): boolean => false;
    clearTimeout(this.timer);
    this.sequence++;
    this.coordinator.close();
    this.selected.set('');
    this.result.set(null);
    this.busy.set(false);
    this.validChange.emit(false);
  }
  async load(page = this.page(), reset = false): Promise<void> {
    if (this.disabled() && !this.summaryOnly()) {
      return;
    }
    this.confirmedContext = (): boolean => false;
    this.selected.set('');
    if (reset) {
      this.coordinator.reset();
    }
    const sequence = ++this.sequence;
    const epoch = this.actor.epoch;
    const documents = this.documents();
    const field = this.field();
    const data = this.data();
    const locale = this.locale();
    const current = (): boolean =>
      documents === this.documents() &&
      field === this.field() &&
      data === this.data() &&
      locale === this.locale();
    this.busy.set(true);
    this.error.set('');
    if (!this.summaryOnly()) {
      this.validChange.emit(false);
    }
    try {
      const query = inspectionQuery(
        'options',
        this.documents(),
        this.field().path,
        this.data(),
        {
          search: this.search(),
          page: String(page),
          rows: this.positions(),
        },
      );
      const selected = this.summaryOnly()
        ? [encodeChoice(this.summaryValue()!)]
        : [];
      const result = await this.coordinator.load({
        data: this.data(),
        locale: this.locale(),
        page,
        search: this.search(),
        indices: query['row_indices'] as number[],
        selected,
      });
      if (
        sequence === this.sequence &&
        epoch === this.actor.epoch &&
        current() &&
        result
      ) {
        this.page.set(page);
        this.result.set(result);
        this.confirmedContext = current;
      }
    } catch (error) {
      if (sequence === this.sequence && epoch === this.actor.epoch) {
        this.result.set(null);
        this.error.set(
          error instanceof Error &&
            error.message ===
              'Enter a valid page and row position before previewing options.'
            ? error.message
            : 'The service is unavailable.',
        );
      }
    } finally {
      if (sequence === this.sequence && epoch === this.actor.epoch) {
        this.busy.set(false);
      }
    }
  }
  choose(key: string): void {
    if (this.disabled() || this.busy()) {
      return;
    }
    if (key === 'no-value' && this.nullable()) {
      this.selected.set(key);
      this.picked.emit({ value: null, label: 'No value' });
      this.validChange.emit(true);
      return;
    }
    const item =
      this.confirmedContext() &&
      this.result()?.state === 'READY' &&
      this.result()?.items.find((candidate) => candidate.key === key);
    if (item) {
      const value = decodeChoice(key);
      if (
        typeof value === 'number' &&
        parseNumberText(key.slice(5)) !== value
      ) {
        this.error.set(
          'This value cannot be represented without losing precision.',
        );
        this.validChange.emit(false);
      } else {
        this.selected.set(key);
        this.picked.emit({ value, label: item.value });
        this.validChange.emit(true);
      }
    }
  }
}
