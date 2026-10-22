import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { ActorState } from '../auth/actor-state';
import { SessionContext } from '../auth/session-context';
import { Locale } from '../localization/locale';
import { Area, canEnterArea } from '../permissions/area-access';
export type BreadcrumbItem = {
  label: string;
  literal?: boolean;
  path?: string;
  back?: () => Promise<void>;
};
type ObjectContext = {
  title: string;
  collection: string;
  path: string;
  back: () => Promise<void>;
};
const areaLabels: Record<Area, string> = {
  operations: 'Operations',
  studio: 'Studio',
  administration: 'Administration',
};
/** Presentation-only route identity. Feature owners provide authorized names and local back behavior. */
@Injectable({ providedIn: 'root' })
export class WorkspaceNavigationService {
  private readonly router = inject(Router);
  private readonly locale = inject(Locale);
  private readonly session = inject(SessionContext);
  private readonly title = inject(Title);
  private readonly root = signal(this.router.routerState.snapshot.root);
  private readonly object = signal<ObjectContext | null>(null);
  readonly focusMode = signal(false);
  readonly editor = computed(() =>
    this.chain().some((route) => route.data['editor'] === true),
  );
  private readonly chain = computed(() => {
    const result: ActivatedRouteSnapshot[] = [];
    let route: ActivatedRouteSnapshot | null = this.root();
    while (route) {
      result.push(route);
      route = route.firstChild;
    }
    return result;
  });
  readonly items = computed<readonly BreadcrumbItem[]>(() => {
    const actor = this.session.snapshot();
    const chain = this.chain();
    const areas = Object.keys(areaLabels) as Area[];
    const home =
      actor.status === 'authenticated'
        ? areas.find((area) => canEnterArea(actor.permissions, area))
        : undefined;
    const result: BreadcrumbItem[] = [
      { label: 'Workspace', path: home ? '/' + home : '/account' },
    ];
    const area = areas.find((key) =>
      chain.some(
        (route) =>
          route.routeConfig?.path === key ||
          route.data['breadcrumbArea'] === key,
      ),
    );
    if (
      area &&
      actor.status === 'authenticated' &&
      canEnterArea(actor.permissions, area)
    ) {
      result.push({ label: areaLabels[area], path: '/' + area });
    }
    const last = chain.at(-1);
    const label = String(
      last?.data['breadcrumb'] ?? last?.title?.split(' | ')[0] ?? 'Workspace',
    );
    const context = this.object();
    if (context) {
      result.push(
        { label: context.collection, path: context.path, back: context.back },
        { label: context.title, literal: true },
      );
    } else if (result.at(-1)?.label === label) {
      result[result.length - 1] = { label };
    } else {
      result.push({ label });
    }
    return result;
  });
  constructor() {
    inject(ActorState).register(() => {
      this.object.set(null);
      this.focusMode.set(false);
    });
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.root.set(this.router.routerState.snapshot.root);
        if (!this.editor()) {
          this.focusMode.set(false);
        }
      }
    });
    effect(() => {
      this.locale.language();
      const item = this.items().at(-1);
      const label = item?.label ?? 'Workspace';
      this.title.setTitle(
        (item?.literal ? label : this.locale.text(label)) +
          ' | ' +
          this.locale.text('Workflow workspace'),
      );
    });
  }
  collectionPath(): string {
    const tree = this.router.parseUrl(this.router.url);
    delete tree.queryParams['selected'];
    tree.fragment = null;
    return this.router.serializeUrl(tree);
  }
  present(context: ObjectContext | null): () => void {
    this.object.set(context);
    return () => {
      if (this.object() === context) {
        this.object.set(null);
      }
    };
  }
  activate(event: MouseEvent, item: BreadcrumbItem): void {
    if (
      !item.back ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    void item.back();
  }
}
