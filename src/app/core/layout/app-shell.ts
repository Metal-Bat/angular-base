import { WorkspaceBreadcrumbs } from './workspace-breadcrumbs/workspace-breadcrumbs';
import { WorkspaceNavigationService } from './workspace-navigation.service';
import { WorkspaceNotifications } from './workspace-notifications';
import { WorkspaceAccount } from './workspace-account/workspace-account';
import { WorkspacePreferences } from './workspace-preferences/workspace-preferences';
import { isSupportedLocale } from '../localization/languages';
import { NotificationPreview } from '../notifications/notification-preview';
import { ButtonModule } from 'primeng/button';
import { Preferences } from '../auth/preferences';
import { Locale } from '../localization/locale';
import { ColorScheme } from '../theme/color-scheme';
import { Feedback } from '../feedback/feedback';
import { CommandFeedback } from '../../shared/ui/command-feedback/command-feedback';
import { LocalizePipe } from '../../shared/ui/localize-pipe';
import { NavigationEnd } from '@angular/router';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PrimeNG } from 'primeng/config';
import { AuthSession } from '../auth/auth-session';
import { SessionContext } from '../auth/session-context';
import { Area, canEnterArea, hasPermissions } from '../permissions/area-access';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  imports: [
    WorkspaceNotifications,
    WorkspaceBreadcrumbs,
    WorkspacePreferences,
    WorkspaceAccount,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LocalizePipe,
    CommandFeedback,
    ButtonModule,
  ],
  selector: 'app-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app-shell.scss',
  templateUrl: './app-shell.html',
})
export class AppShell {
  private readonly shell = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly header =
    viewChild<ElementRef<HTMLElement>>('workspaceHeader');
  private readonly destroyRef = inject(DestroyRef);
  canManageWorkflows(): boolean {
    const actor = this.session.snapshot();
    return (
      actor.status === 'authenticated' &&
      hasPermissions(actor.permissions, ['workflows.manage'])
    );
  }
  canManageUsers(): boolean {
    const actor = this.session.snapshot();
    return (
      actor.status === 'authenticated' &&
      hasPermissions(actor.permissions, ['admin.users.manage'])
    );
  }

  readonly auth = inject(AuthSession);
  private readonly session = inject(SessionContext);
  readonly signedIn = computed(
    () => this.session.snapshot().status === 'authenticated',
  );
  readonly locale = inject(Locale);
  readonly scheme = inject(ColorScheme);
  readonly preferences = inject(Preferences);
  readonly feedback = inject(Feedback);
  readonly menuOpen = signal(false);
  readonly notifications = inject(NotificationPreview);
  readonly notificationsOpen = signal(false);
  readonly areas = ['operations', 'studio', 'administration'] as const;
  readonly visibleAreas = computed(() =>
    this.areas.filter((area) => this.canEnter(area)),
  );
  readonly areaLabels = {
    operations: 'Operations',
    studio: 'Studio',
    administration: 'Administration',
  };
  readonly areaIcons = {
    operations: 'pi pi-th-large',
    studio: 'pi pi-sliders-h',
    administration: 'pi pi-shield',
  };
  readonly shortcuts = [
    { label: 'Calendar', path: '/operations/calendar', icon: 'pi pi-calendar' },
    {
      label: 'Dashboard',
      path: '/operations/dashboard',
      icon: 'pi pi-chart-bar',
    },
    { label: 'Favorites', path: '/operations/favorites', icon: 'pi pi-star' },
    { label: 'My requests', path: '/operations/requests', icon: 'pi pi-file' },
    { label: 'Task inbox', path: '/operations/tasks', icon: 'pi pi-inbox' },
    {
      label: 'My reports',
      path: '/operations/reports',
      icon: 'pi pi-chart-bar',
    },
  ];
  readonly navigation = inject(WorkspaceNavigationService);
  private readonly router = inject(Router);
  constructor() {
    afterNextRender(() => {
      const header = this.header()?.nativeElement;
      if (!header) {
        return;
      }
      let frame: number | undefined;
      const updateHeaderHeight = (): void => {
        frame = undefined;
        const style = this.shell.nativeElement.style;
        const height = header.getBoundingClientRect().height + 'px';
        if (style.getPropertyValue('--workspace-header-height') !== height) {
          style.setProperty('--workspace-header-height', height);
        }
      };
      // Defer layout writes until after observer delivery to avoid a feedback
      // loop when a measured header changes the sidebar's available height.
      const observer = new ResizeObserver(() => {
        frame ??= requestAnimationFrame(updateHeaderHeight);
      });
      updateHeaderHeight();
      observer.observe(header);
      this.destroyRef.onDestroy(() => {
        observer.disconnect();
        if (frame !== undefined) {
          cancelAnimationFrame(frame);
        }
      });
    });

    const prime = inject(PrimeNG);
    effect((): void => {
      prime.setTranslation({
        accept: this.locale.text('Continue'),
        reject: this.locale.text('Cancel'),
        emptyMessage: this.locale.text('Nothing to show.'),
        chooseDate: this.locale.text('Choose date'),
        prevHour: this.locale.text('Previous hour'),
        nextHour: this.locale.text('Next hour'),
        prevMinute: this.locale.text('Previous minute'),
        nextMinute: this.locale.text('Next minute'),
        prevSecond: this.locale.text('Previous second'),
        nextSecond: this.locale.text('Next second'),
        aria: { ...prime.translation.aria, close: this.locale.text('Close') },
      });
    });
    const injector = inject(Injector);
    let previousPath = '';
    let navigation = 0;
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event): void => {
      if (event instanceof NavigationEnd) {
        this.menuOpen.set(false);
        const current = ++navigation;
        const path = new URL(event.urlAfterRedirects, document.baseURI)
          .pathname;
        if (path !== previousPath) {
          afterNextRender(
            () => {
              if (current === navigation) {
                document.querySelector<HTMLElement>('main h1')?.focus();
              }
            },
            { injector },
          );
        }
        previousPath = path;
      }
    });
  }
  toggleNotifications(): void {
    this.notificationsOpen.update((value) => !value);
    if (this.notificationsOpen()) {
      void this.notifications.load();
    }
  }
  setLanguage(value: string): void {
    if (isSupportedLocale(value)) {
      void this.preferences.language(value);
    }
  }

  canEnter(area: Area): boolean {
    const snapshot = this.session.snapshot();
    return (
      snapshot.status === 'authenticated' &&
      canEnterArea(snapshot.permissions, area)
    );
  }
}
