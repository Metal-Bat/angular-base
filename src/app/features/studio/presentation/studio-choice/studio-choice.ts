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
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { STUDIO_API } from '../../bindings';
import {
  referenceChoice,
  ReferenceChoice,
} from '../../../administration/domain/reference-options';
import { JsonObject } from '../../../forms/domain/runtime-document';
@Component({
  selector: 'app-studio-choice',
  imports: [
    FormsModule,
    ButtonDirective,
    InputText,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './studio-choice.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioChoice {
  readonly kind = input.required<string>();
  readonly controlId = input.required<string>();
  readonly value = input<string>('');
  readonly disabled = input(false);
  readonly picked = output<string>();
  readonly fallback = computed(
    () => this.value() && !this.rows().some((row) => row.key === this.value()),
  );
  readonly rows = signal<readonly ReferenceChoice[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly search = signal('');
  readonly page = signal(1);
  readonly pages = signal(0);
  private generation = 0;
  private readonly api = inject(STUDIO_API);
  private readonly locale = inject(Locale);
  constructor() {
    effect(() => {
      this.kind();
      this.locale.language();
      this.disabled();
      this.reset();
    });
    const release = inject(ActorState).register(() => this.reset());
    inject(DestroyRef).onDestroy(() => {
      this.reset();
      release();
    });
  }
  reset(): void {
    this.generation++;
    this.rows.set([]);
    this.error.set('');
    this.search.set('');
    this.page.set(1);
    this.pages.set(0);
    this.busy.set(false);
  }
  async load(page = 1): Promise<void> {
    if (this.disabled() || this.busy()) {
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    this.rows.set([]);
    try {
      const response = (await this.api.auxiliary(
        'selectors',
        {
          page,
          size: 20,
          ...(this.search().trim()
            ? { search: this.search().trim().slice(0, 100) }
            : {}),
        },
        { kind: this.kind() },
      )) as { items: JsonObject[]; totalPages: number };
      if (generation !== this.generation || this.disabled()) {
        return;
      }
      this.rows.set(response.items.map(referenceChoice));
      this.page.set(page);
      this.pages.set(response.totalPages);
    } catch {
      if (generation === this.generation) {
        this.error.set('Reference search failed. Retry or reload.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  choose(value: string): void {
    if (!this.disabled() && this.rows().some((row) => row.key === value)) {
      this.picked.emit(value);
    }
  }
}
