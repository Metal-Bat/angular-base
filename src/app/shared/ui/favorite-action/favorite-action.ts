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
import { ButtonDirective } from 'primeng/button';
import { ResourceLinks } from '../../../core/resources/resource-links';
import { ActorState } from '../../../core/auth/actor-state';
import { PersonalCollections } from '../../../core/resources/personal-collections';
import type { components } from '../../../core/transport/generated/schema';
import { LocalizePipe } from '../localize-pipe';
@Component({
  selector: 'app-favorite-action',
  imports: [ButtonDirective, LocalizePipe],
  templateUrl: './favorite-action.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteAction {
  readonly kind = input.required<components['schemas']['ResourceKind']>();
  readonly reference = input.required<string>();
  readonly disabled = input(false);
  readonly busy = signal(false);
  readonly favoriteRef = signal<string | null>(null);
  readonly saved = computed(() => this.favoriteRef() !== null);
  readonly ready = signal(false);
  readonly error = signal('');
  private readonly api = inject(PersonalCollections);
  private readonly links = inject(ResourceLinks);
  private generation = 0;
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.favoriteRef.set(null);
      this.ready.set(false);
      this.error.set('');
      this.busy.set(false);
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      release();
    });
    effect(() => {
      const reference = this.reference();
      const kind = this.kind();
      untracked(() => void this.load(kind, reference));
    });
  }
  async refresh(): Promise<void> {
    if (!this.busy()) {
      await this.load(this.kind(), this.reference());
    }
  }
  private async membership(locator: string): Promise<string | null> {
    for (let page = 1; page <= 100; page++) {
      const result = await this.api.favorites(page);
      const match = result.items.find((row) => row.target.locator === locator);
      if (match) {
        return match.ref_id;
      }
      if (page >= result.totalPages) {
        return null;
      }
    }
    throw Error('Favorite state could not be confirmed');
  }
  private async load(
    kind: components['schemas']['ResourceKind'],
    reference: string,
  ): Promise<void> {
    const generation = ++this.generation;
    this.favoriteRef.set(null);
    this.ready.set(false);
    this.error.set('');
    if (!reference) {
      return;
    }
    this.busy.set(true);
    try {
      const target = await this.links.mint({ kind, ref_id: reference });
      const favoriteRef = await this.membership(target.locator);
      if (generation === this.generation) {
        this.favoriteRef.set(favoriteRef);
        this.ready.set(true);
      }
    } catch {
      if (generation === this.generation) {
        this.error.set(
          'The command could not be confirmed. Refresh current state before retrying.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }

  async toggle(): Promise<void> {
    if (this.busy() || this.disabled() || !this.ready() || !this.reference()) {
      return;
    }
    const generation = this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const reference = this.favoriteRef();
      if (reference) {
        await this.api.unfavorite(reference);
      } else {
        await this.api.favorite({
          kind: this.kind(),
          ref_id: this.reference(),
        });
      }
      if (generation !== this.generation) {
        return;
      }
      const target = await this.links.mint({
        kind: this.kind(),
        ref_id: this.reference(),
      });
      const current = await this.membership(target.locator);
      if (generation === this.generation) {
        this.favoriteRef.set(current);
      }
    } catch {
      if (generation === this.generation) {
        this.ready.set(false);
        this.error.set(
          'The command could not be confirmed. Refresh current state before retrying.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
