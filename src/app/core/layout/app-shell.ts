import { WorkspaceNotifications } from './workspace-notifications';
import { SelectControl } from '../../shared/ui/select-control/select-control';
import { isSupportedLocale } from '../localization/languages';
import { NotificationPreview } from '../notifications/notification-preview';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
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
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  imports: [
    WorkspaceNotifications,
    SelectControl,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LocalizePipe,
    CommandFeedback,
    ButtonModule,
    FormsModule,
    SelectModule,
  ],
  selector: 'app-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app-shell.scss',
  templateUrl: './app-shell.html',
})
export class AppShell {
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
  readonly themeGroups = computed(() =>
    (['light', 'dark'] as const).map((mode) => ({
      label: this.locale.text(mode === 'light' ? 'Light mode' : 'Dark mode'),
      icon: mode === 'light' ? 'pi pi-sun' : 'pi pi-moon',
      items: this.scheme.palettes.map((palette) => ({
        value: `${palette.key}-${mode}`,
        label: `${this.locale.text(palette.name)} · ${this.locale.text(mode === 'light' ? 'Light' : 'Dark')}`,
        color: `var(--p-${palette.key}-500)`,
      })),
    })),
  );
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
    { label: 'My requests', path: '/operations/requests', icon: 'pi pi-file' },
    { label: 'Task inbox', path: '/operations/tasks', icon: 'pi pi-inbox' },
    {
      label: 'My reports',
      path: '/operations/reports',
      icon: 'pi pi-chart-bar',
    },
    {
      label: 'Private uploads',
      path: '/operations/media',
      icon: 'pi pi-folder',
    },
  ];
  readonly breadcrumb = signal('');
  private readonly router = inject(Router);
  constructor() {
    const prime = inject(PrimeNG);
    effect((): void => {
      prime.setTranslation({
        accept: this.locale.text('Continue'),
        reject: this.locale.text('Cancel'),
        emptyMessage: this.locale.text('Nothing to show.'),
        aria: { ...prime.translation.aria, close: this.locale.text('Close') },
      });
    });
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event): void => {
      if (event instanceof NavigationEnd) {
        this.menuOpen.set(false);
        const area = event.urlAfterRedirects.split('/')[1].split('?')[0];
        this.breadcrumb.set(
          event.urlAfterRedirects.split('?')[0] === '/account/profile'
            ? 'My information'
            : ((
                {
                  operations: 'Operations',
                  studio: 'Studio',
                  administration: 'Administration',
                  users: 'Users',
                  login: 'Sign in',
                  'ui-preview': 'Form controls',
                  forbidden: 'Access denied',
                  'access-unavailable': 'Access unavailable',
                  account: 'Account and sessions',
                } as Record<string, string>
              )[area] ?? 'Page not found'),
        );
        setTimeout((): void => {
          document.querySelector<HTMLElement>('main h1')?.focus();
        });
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
      void this.locale.set(value);
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
