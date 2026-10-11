import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ActorState } from './actor-state';
import { ApiClient } from '../transport/api-client';
import { readData } from '../transport/response-adapters';
import { record } from '../transport/api-failure';
import type { components } from '../transport/generated/schema';
type Profile = components['schemas']['ProfileDTO'];
type Patch = components['schemas']['ProfilePatch'];
function decode(raw: unknown): Profile {
  const value = record(raw);
  if (typeof value['ref_id'] !== 'string' || !value['ref_id']) {
    throw Error('Invalid profile');
  }
  for (const key of ['first_name', 'last_name', 'avatar_ref_id']) {
    if (value[key] !== null && typeof value[key] !== 'string') {
      throw Error('Invalid profile');
    }
  }
  return raw as Profile;
}
@Injectable({ providedIn: 'root' })
export class ProfileSettings {
  private readonly api = inject(ApiClient);
  private readonly actor = inject(ActorState);
  readonly value = signal<Profile | null>(null);
  async read(): Promise<Profile> {
    const epoch = this.actor.epoch;
    const value = readData(
      await firstValueFrom(
        this.api.call(
          'read_profile_api_v1_me_profile_get',
          {},
          this.actor.abortSignal,
        ),
      ),
      decode,
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    this.value.set(value);
    return value;
  }
  constructor() {
    const release = this.actor.register(() => this.value.set(null));
    inject(DestroyRef).onDestroy(release);
  }
  async save(patch: Patch): Promise<Profile> {
    const epoch = this.actor.epoch;
    const value = readData(
      await firstValueFrom(
        this.api.call(
          'apply_profile_api_v1_me_profile_patch',
          { body: patch },
          this.actor.abortSignal,
        ),
      ),
      decode,
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    this.value.set(value);
    return value;
  }
}
