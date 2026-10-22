import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { ResourceLinks } from '../../../../core/resources/resource-links';
import {
  Favorite,
  PersonalCollections,
} from '../../../../core/resources/personal-collections';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
const routes: Readonly<Record<string, string>> = {
  users: '/administration/admin-users',
  work_groups: '/administration/groups',
  connections: '/administration/integrations',
  agent_versions: '/administration/agents',
  step_versions: '/administration/step-types',
  forms: '/studio/forms',
  workflows: '/studio/workflows',
  clients: '/studio/clients',
  form_versions: '/studio/form-versions',
  workflow_versions: '/studio/workflow-versions',
  client_releases: '/studio/client-releases',
  request_types: '/studio/request-types',
  components: '/studio/form-components',
  component_versions: '/studio/form-component-versions',
  data_types: '/studio/form-data-types',
  data_type_versions: '/studio/form-data-type-versions',
};
const kindLabels: Readonly<Record<string, string>> = {
  users: 'Users',
  work_groups: 'Work groups',
  clients: 'Clients',
  client_releases: 'Client releases',
  forms: 'Forms',
  form_versions: 'Form versions',
  workflows: 'Workflows',
  workflow_versions: 'Workflow versions',
  step_versions: 'Step versions',
  request_types: 'Request types',
  connections: 'Connections',
  agent_versions: 'Agent versions',
  components: 'Components',
  component_versions: 'Component versions',
  data_types: 'Data types',
  data_type_versions: 'Data type versions',
};
@Component({
  selector: 'app-favorites',
  imports: [ButtonDirective, LocalizePipe],
  templateUrl: './favorites.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Favorites {
  href(row: Favorite): string | null {
    const route = routes[row.target.route_key];
    return row.target.available && row.target.ref_id && route
      ? this.router.serializeUrl(
          this.router.createUrlTree([route], {
            queryParams: { selected: row.target.ref_id },
          }),
        )
      : null;
  }
  follow(event: MouseEvent, row: Favorite): void {
    if (
      event.button ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    void this.open(row);
  }
  kindLabel(kind: string): string {
    return kindLabels[kind] ?? 'Resource';
  }
  readonly rows = signal<readonly Favorite[]>([]);
  readonly page = signal(1);
  readonly pages = signal(0);
  readonly busy = signal(false);
  readonly error = signal('');
  private readonly api = inject(PersonalCollections);
  private readonly links = inject(ResourceLinks);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  readonly reconcileRequired = signal(false);
  private readonly actor = inject(ActorState);
  private generation = 0;
  constructor() {
    const release = this.actor.register(() => {
      this.generation++;
      this.rows.set([]);
      this.error.set('Access changed. Reload this page.');
      this.page.set(1);
      this.pages.set(0);
      this.busy.set(false);
      this.reconcileRequired.set(false);
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      release();
    });
    void this.load();
  }
  async load(page = 1): Promise<void> {
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.api.favorites(page);
      if (generation !== this.generation) {
        return;
      }
      this.rows.set(result.items);
      this.page.set(result.page);
      this.pages.set(result.totalPages);
      this.reconcileRequired.set(false);
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
  async open(row: Favorite): Promise<void> {
    if (this.busy()) {
      return;
    }
    const generation = this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const current = await this.links.resolve(row.target.locator);
      if (generation !== this.generation) {
        return;
      }
      const route = routes[current.route_key];
      if (!route) {
        throw Error('Destination unavailable');
      }
      await this.router.navigate([route], {
        queryParams: { selected: current.ref_id },
      });
    } catch {
      if (generation === this.generation) {
        const epoch = this.actor.epoch;
        await this.load(this.page());
        if (epoch === this.actor.epoch) {
          this.error.set('This resource is unavailable.');
        }
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  async remove(row: Favorite): Promise<void> {
    const generation = this.generation;
    if (this.busy() || this.reconcileRequired()) {
      return;
    }
    const index = this.rows().findIndex((item) => item.ref_id === row.ref_id);
    const epoch = this.actor.epoch;
    this.busy.set(true);
    try {
      await this.api.unfavorite(row.ref_id);
      if (generation === this.generation) {
        await this.load(this.page());
        if (epoch === this.actor.epoch) {
          if (!this.rows().length && this.page() > 1 && !this.error()) {
            await this.load(this.page() - 1);
          }
          afterNextRender(
            () => {
              if (epoch !== this.actor.epoch) {
                return;
              }
              const links =
                this.host.nativeElement.querySelectorAll<HTMLElement>(
                  '[data-favorite-open]',
                );
              (
                links[Math.min(index, links.length - 1)] ??
                this.host.nativeElement.querySelector<HTMLButtonElement>(
                  '[data-favorite-reload]',
                )
              )?.focus();
            },
            { injector: this.injector },
          );
        }
      }
    } catch {
      if (generation === this.generation) {
        this.reconcileRequired.set(true);
        this.error.set(
          'Your edits have been kept. Check the latest revision before continuing.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
