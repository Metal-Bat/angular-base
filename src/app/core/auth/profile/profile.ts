import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../transport/api-client';
import { record } from '../../transport/api-failure';
import { readData } from '../../transport/response-adapters';
import { ActorState } from '../actor-state';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import { RecordSummary } from '../../../shared/ui/record-summary/record-summary';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, ButtonDirective, LocalizePipe, RecordSummary],
  host: { class: 'console-page' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly api = inject(ApiClient);
  readonly profile = signal<Readonly<Record<string, unknown>> | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly name = computed(() => {
    const user = this.profile();
    return (
      [user?.['first_name'], user?.['last_name']].filter(Boolean).join(' ') ||
      String(user?.['username'] ?? '')
    );
  });
  private generation = 0;

  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.profile.set(null);
      this.busy.set(false);
      this.error.set('');
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      release();
    });
    void this.load();
  }

  async load(): Promise<void> {
    if (this.busy()) {
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    this.profile.set(null);
    this.error.set('');
    try {
      const user = readData(
        await firstValueFrom(this.api.call('me_api_v1_auth_me_get', {})),
        (value) => {
          const row = record(value);
          if (
            typeof row['username'] !== 'string' ||
            typeof row['is_active'] !== 'boolean'
          ) {
            throw Error('Invalid profile response.');
          }
          const fields = [
            'username',
            'email',
            'first_name',
            'last_name',
            'created_at',
            'updated_at',
            'is_active',
            'is_superuser',
          ];
          return Object.fromEntries(
            fields
              .filter((key) => row[key] !== undefined)
              .map((key) => [key, row[key]]),
          );
        },
      );
      if (generation === this.generation) {
        this.profile.set(user);
      }
    } catch {
      if (generation === this.generation) {
        this.error.set('The service is unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
