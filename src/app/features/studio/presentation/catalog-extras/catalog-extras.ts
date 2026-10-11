import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { StudioChoice } from '../studio-choice/studio-choice';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { FavoriteAction } from '../../../../shared/ui/favorite-action/favorite-action';
import { SavedViews } from '../../../../shared/ui/saved-views/saved-views';
import { DependencyReadiness } from '../../../readiness/public-api';
import { DependencyReport } from '../../../readiness/domain/dependencies';
import type { ResourceCatalog } from '../resource-catalog/resource-catalog';
@Component({
  selector: 'app-catalog-extras',
  imports: [
    FavoriteAction,
    SavedViews,
    DependencyReadiness,
    StudioChoice,
    LocalizePipe,
  ],
  templateUrl: './catalog-extras.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogExtras {
  private readonly route = inject(ActivatedRoute);
  private readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly repairNode = computed(
    () => this.query().get('repair_node')?.slice(0, 256) ?? '',
  );
  private urlRelease: string | undefined;
  readonly clientRelease = signal('');
  readonly client = signal('');
  chooseClient(value: string): void {
    this.client.set(value);
    this.clientRelease.set('');
  }
  constructor() {
    effect(() => {
      const release = this.query().get('client_release')?.slice(0, 512) ?? '';
      if (release !== this.urlRelease) {
        this.urlRelease = release;
        this.clientRelease.set(release);
        this.client.set('');
      }
    });
    const release = inject(ActorState).register(() => {
      this.clientRelease.set('');
      this.client.set('');
    });
    inject(DestroyRef).onDestroy(release);
  }
  private readonly views = viewChild(SavedViews);
  async canLeave(): Promise<boolean> {
    return this.views()?.canLeave() ?? true;
  }
  readonly catalog = input.required<ResourceCatalog>();
  readonly inspect =
    input.required<
      (ref: string, client?: string) => Promise<DependencyReport>
    >();
}
