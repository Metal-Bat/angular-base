import { Clipboard } from '@angular/cdk/clipboard';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import { Locale } from '../../localization/locale';
import { ErrorNotice, RequestErrors } from '../request-errors';

@Component({
  selector: 'app-error-notification',
  imports: [ToastModule, ButtonModule, LocalizePipe],
  providers: [MessageService],
  templateUrl: './error-notification.html',
  styleUrl: './error-notification.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorNotification {
  readonly errors = inject(RequestErrors);
  private readonly messages = inject(MessageService);
  private readonly clipboard = inject(Clipboard);
  private readonly locale = inject(Locale);
  readonly copying = signal(false);
  readonly copyStatus = signal('');
  readonly copied = signal(false);

  constructor() {
    afterRenderEffect(() => {
      const notice = this.errors.notice();
      this.copyStatus.set('');
      this.copied.set(false);
      this.copying.set(false);
      this.messages.clear('request-error');
      if (notice) {
        this.messages.add({
          key: 'request-error',
          severity: 'error',
          summary: this.locale.text('Request failed'),
          data: notice,
          sticky: true,
          closable: true,
        });
      }
    });
  }

  async copy(notice: ErrorNotice): Promise<void> {
    if (this.copying()) {
      return;
    }
    this.copying.set(true);
    let success = false;
    try {
      if (typeof globalThis.navigator?.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(notice.code);
        success = true;
      }
    } catch {
      /* Try the browser clipboard fallback. */
    }
    if (!success) {
      try {
        success = this.clipboard.copy(notice.code);
      } catch {
        /* Show failure below. */
      }
    }
    if (this.errors.notice()?.id === notice.id) {
      this.copying.set(false);
      this.copied.set(success);
      this.copyStatus.set(
        success
          ? 'Copied to clipboard'
          : 'Could not copy. Select the code and copy it manually.',
      );
    }
  }

  close(data: unknown): void {
    if (
      typeof data === 'object' &&
      data !== null &&
      'id' in data &&
      typeof data.id === 'number'
    ) {
      this.errors.dismiss(data.id);
    }
  }
}
