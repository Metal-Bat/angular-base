import { ButtonDirective } from 'primeng/button';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../transport/api-client';
import { record } from '../../transport/api-failure';
import { readData, readResultPage } from '../../transport/response-adapters';
import { Feedback } from '../../feedback/feedback';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import { ActorState } from '../actor-state';
import { AuthSession } from '../auth-session';
type SessionRow = {
  ref: string;
  device: string;
  lastUsed: string;
  expires: string;
};
@Component({
  host: { class: 'console-page' },
  selector: 'app-account',
  imports: [ButtonDirective, FormsModule, LocalizePipe],
  templateUrl: './account.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Account {
  private readonly api = inject(ApiClient);
  private readonly auth = inject(AuthSession);
  private readonly actor = inject(ActorState);
  private readonly feedback = inject(Feedback);
  readonly sessions = signal<readonly SessionRow[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly selectedSession = signal<SessionRow | null>(null);
  readonly resetToken = signal('');
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  private generation = 0;
  constructor() {
    const release = this.actor.register((): void => {
      this.generation++;
      this.clearSecrets();
      this.sessions.set([]);
    });
    inject(DestroyRef).onDestroy((): void => {
      this.generation++;
      release();
      this.clearSecrets();
    });
    void this.load();
  }
  private clearSecrets(): void {
    this.resetToken.set('');
    this.selectedSession.set(null);
    this.currentPassword.set('');
    this.newPassword.set('');
  }
  async load(page = 1): Promise<void> {
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const response = await firstValueFrom(
        this.api.call('list_sessions_api_v1_auth_sessions_search_post', {
          body: { page, size: 20, filters: [], sort_orders: [] },
        }),
      );
      const result = readResultPage(response, (value) => {
        const row = record(value);
        if (
          typeof row['ref_id'] !== 'string' ||
          typeof row['last_used_at'] !== 'string' ||
          typeof row['expires_at'] !== 'string'
        ) {
          throw Error('Invalid session');
        }
        return {
          ref: row['ref_id'],
          device: String(row['device_name'] ?? 'Unnamed device'),
          lastUsed: row['last_used_at'],
          expires: row['expires_at'],
        };
      });
      if (generation === this.generation) {
        this.sessions.set(result.items);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
      }
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
  async sessionDetail(reference: string): Promise<void> {
    const generation = ++this.generation;
    this.selectedSession.set(null);
    try {
      const detail = readData(
        await firstValueFrom(
          this.api.call('get_session_api_v1_auth_sessions__ref_id__get', {
            path: { ref_id: reference },
          }),
        ),
        (raw) => {
          const value = record(raw);
          return {
            ref: String(value['ref_id']),
            device: String(value['device_name'] ?? 'Unnamed device'),
            lastUsed: String(value['last_used_at']),
            expires: String(value['expires_at']),
          };
        },
      );
      if (generation === this.generation) {
        this.selectedSession.set(detail);
      }
    } catch {
      if (generation === this.generation) {
        this.error.set('Session is unavailable');
      }
    }
  }
  async resetPassword(): Promise<void> {
    if (this.busy() || !this.resetToken() || this.newPassword().length < 8) {
      return;
    }
    const body = { token: this.resetToken(), new_password: this.newPassword() };
    this.clearSecrets();
    this.busy.set(true);
    try {
      readData(
        await firstValueFrom(
          this.api.call('reset_password_api_v1_auth_reset_password_post', {
            body,
          }),
        ),
        () => undefined,
      );
      await this.auth.logout();
    } catch {
      this.error.set(
        'Password reset failed. Request a new reset token from your administrator.',
      );
    } finally {
      this.busy.set(false);
    }
  }
  async revoke(reference: string): Promise<void> {
    if (this.busy() || !(await this.feedback.confirm('Revoke this session?'))) {
      return;
    }
    this.busy.set(true);
    try {
      readData(
        await firstValueFrom(
          this.api.call('revoke_session_api_v1_auth_sessions__ref_id__delete', {
            path: { ref_id: reference },
          }),
        ),
        (value) => value,
      );
      await this.auth.revalidate();
      if (this.auth.profile()) {
        await this.load(this.page());
      }
    } catch {
      this.error.set('Check session state before trying again');
    } finally {
      this.busy.set(false);
    }
  }
  async logoutAll(): Promise<void> {
    if (
      this.busy() ||
      !(await this.feedback.confirm('Sign out all sessions?'))
    ) {
      return;
    }
    this.busy.set(true);
    try {
      readData(
        await firstValueFrom(
          this.api.call('logout_all_api_v1_auth_logout_all_post', {}),
        ),
        (value) => value,
      );
      await this.auth.logout();
    } catch {
      this.error.set('Check session state before trying again');
    } finally {
      this.busy.set(false);
    }
  }
  async changePassword(): Promise<void> {
    if (
      this.busy() ||
      !this.currentPassword() ||
      this.newPassword().length < 8
    ) {
      return;
    }
    const body = {
      current_password: this.currentPassword(),
      new_password: this.newPassword(),
    };
    this.clearSecrets();
    this.busy.set(true);
    this.error.set('');
    try {
      readData(
        await firstValueFrom(
          this.api.call('change_password_api_v1_auth_change_password_post', {
            body,
          }),
        ),
        (value) => value,
      );
      await this.auth.logout();
    } catch {
      this.error.set(
        'Password change failed. Check the current password and try again.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
