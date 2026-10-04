import { NotificationPreview } from '../notifications/notification-preview';
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
import { Area, canEnterArea } from '../permissions/area-access';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LocalizePipe,
    CommandFeedback,
  ],
  selector: 'app-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app-shell.scss',
  templateUrl: './app-shell.html',
})
export class AppShell {
  readonly auth = inject(AuthSession);
  readonly locale = inject(Locale);
  readonly scheme = inject(ColorScheme);
  readonly feedback = inject(Feedback);
  readonly menuOpen = signal(false);
  readonly notifications = inject(NotificationPreview);
  readonly notificationsOpen = signal(false);
  readonly areas = ['operations', 'studio', 'administration'] as const;
  readonly areaLabels = {
    operations: 'Operations',
    studio: 'Studio',
    administration: 'Administration',
  };
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
          (
            {
              operations: 'Operations',
              studio: 'Studio',
              administration: 'Administration',
              login: 'Sign in',
              'ui-preview': 'Form controls',
              forbidden: 'Access denied',
              'access-unavailable': 'Access unavailable',
            } as Record<string, string>
          )[area] ?? 'Page not found',
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
  switchLocale(): void {
    void this.locale.set(this.locale.language() === 'en' ? 'fa' : 'en');
  }

  private readonly session = inject(SessionContext);
  canEnter(area: Area): boolean {
    const snapshot = this.session.snapshot();
    return (
      snapshot.status === 'authenticated' &&
      canEnterArea(snapshot.permissions, area)
    );
  }
}
