import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import { AuthSession } from '../auth-session';
@Component({
  selector: 'app-password-reset',
  imports: [FormsModule, RouterLink, LocalizePipe],
  templateUrl: './password-reset.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordReset {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthSession);
  readonly token = signal('');
  readonly password = signal('');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly done = signal(false);
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.token.set('');
      this.password.set('');
    });
  }
  async submit(): Promise<void> {
    if (this.busy() || !this.token() || this.password().length < 8) {
      return;
    }
    const body = { token: this.token(), new_password: this.password() };
    this.token.set('');
    this.password.set('');
    this.busy.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.http.post('/session/reset-password', body));
      this.auth.invalidate();
      this.done.set(true);
    } catch {
      this.error.set(
        'Password reset failed. Request a new token from your administrator.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
