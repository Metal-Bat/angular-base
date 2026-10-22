import { FavoriteAction } from '../../../../shared/ui/favorite-action/favorite-action';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { Locale } from '../../../../core/localization/locale';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { WorkspaceNavigationService } from '../../../../core/layout/workspace-navigation.service';
import type { ResourceCatalog } from './resource-catalog';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-catalog-header',
  imports: [
    FavoriteAction,
    RouterLink,
    MenuModule,
    ButtonDirective,
    LocalizePipe,
  ],
  templateUrl: './catalog-header.html',
  styleUrl: './resource-catalog.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CatalogHeader {
  readonly versionArea = inject(ActivatedRoute).snapshot.pathFromRoot?.some(
    (route) => route.routeConfig?.path === 'administration',
  )
    ? '/administration'
    : '/studio';
  private readonly locale = inject(Locale);
  readonly objectTitle = computed(() => {
    const vm = this.view();
    const row = vm.selected();
    const name = row?.['name'] ?? row?.['code'];
    if (typeof name === 'string' && name) {
      return name;
    }
    const number = row?.['number'] ?? row?.['version'];
    return number !== undefined && number !== null
      ? this.locale.text('Version') + ' ' + number
      : this.locale.text(vm.spec.title);
  });
  readonly subtitle = computed(() => {
    const vm = this.view();
    const row = vm.selected();
    if (!row) {
      const descriptions: Readonly<Record<string, string>> = {
        clients: 'Manage client registration and access.',
        'client-releases': 'Manage client versions and renderer capabilities.',
        'request-types':
          'Configure request forms, workflows and client restrictions.',
      };
      return this.locale.text(
        descriptions[vm.key] ??
          'Manage definitions, versions and their lifecycle.',
      );
    }
    const version = row['number'] ?? row['version'];
    return [
      this.locale.text(vm.spec.title),
      typeof row['status'] === 'string' ? this.locale.text(row['status']) : '',
      version !== null && version !== undefined
        ? this.locale.text('Version') + ' ' + version
        : '',
    ]
      .filter(Boolean)
      .join(' · ');
  });
  constructor() {
    const navigation = inject(WorkspaceNavigationService);
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    let release = (): void => undefined;
    effect(() => {
      const vm = this.view();
      const row = vm.selected();
      const title = this.objectTitle();
      untracked(() => {
        release();
        release = navigation.present(
          row
            ? {
                title,
                collection: vm.spec.title,
                path: navigation.collectionPath(),
                back: async (): Promise<void> => {
                  if (await vm.canLeave()) {
                    vm.back();
                    await router.navigate([], {
                      relativeTo: route,
                      queryParams: { selected: null },
                      queryParamsHandling: 'merge',
                    });
                  }
                },
              }
            : null,
        );
      });
    });
    inject(DestroyRef).onDestroy(() => release());
  }
  readonly actionItems = computed(() => {
    const vm = this.view();
    this.locale.language();
    return ['publish', 'retire', 'disable', 'rotate', 'remove']
      .filter((action) => vm.spec.actions.includes(action))
      .map((action) => ({
        label: this.locale.text(action),
        command: (): void => {
          if (!vm.busy() && !vm.dirty() && !vm.reconcileRequired()) {
            void vm.act(action);
          }
        },
      }));
  });
  readonly view =
    input.required<
      Pick<
        ResourceCatalog,
        | 'appliedQuery'
        | 'canLeave'
        | 'back'
        | 'act'
        | 'dirty'
        | 'key'
        | 'reference'
        | 'versionCatalog'
        | 'busy'
        | 'reconcileRequired'
        | 'canScope'
        | 'create'
        | 'formOpen'
        | 'edit'
        | 'history'
        | 'immutable'
        | 'load'
        | 'page'
        | 'selected'
        | 'spec'
      >
    >();
}
