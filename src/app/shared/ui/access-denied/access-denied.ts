import { ButtonDirective } from 'primeng/button';
import { AuthSession } from '../../../core/auth/auth-session';
import { LocalizePipe } from '../localize-pipe';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  host: { class: 'console-page console-error' },
  selector: 'app-access-denied',
  imports: [ButtonDirective, LocalizePipe, RouterLink],
  templateUrl: './access-denied.html',
  styleUrl: './access-denied.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessDenied {
  readonly auth = inject(AuthSession);
  private readonly router = inject(Router);
  async retry(): Promise<void> {
    await this.auth.bootstrap();
    if (!this.auth.unavailable()) {
      await this.router.navigateByUrl(
        this.auth.profile() ? '/operations' : '/login',
      );
    }
  }
  protected readonly unavailable =
    inject(ActivatedRoute).snapshot.data['unavailable'] === true;
}
