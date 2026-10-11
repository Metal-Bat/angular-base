import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../actor-state';
import { Feedback } from '../../../feedback/feedback';
import { Preferences } from '../../preferences';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
@Component({
  selector: 'app-workspace-settings',
  imports: [
    FormsModule,
    InputTextModule,
    ButtonDirective,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './workspace-settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceSettings {
  readonly preferences = inject(Preferences);
  timezone = 'UTC';
  readonly invalidZone = signal(false);
  readonly invalidSize = signal(false);
  private readonly feedback = inject(Feedback);
  async canLeave(): Promise<boolean> {
    return (
      this.timezone === this.savedZone ||
      this.feedback.confirm('Discard unsaved profile changes?')
    );
  }
  private savedZone = '';
  constructor() {
    const release = inject(ActorState).register(() => {
      this.savedZone = this.timezone = 'UTC';
      this.invalidZone.set(false);
      this.invalidSize.set(false);
    });
    inject(DestroyRef).onDestroy(release);
    effect(() => {
      const zone = this.preferences.settings()?.locale?.timezone ?? 'UTC';
      if (!this.savedZone || this.timezone === this.savedZone) {
        this.timezone = zone;
      }
      this.savedZone = zone;
    });
  }
  zone(): void {
    try {
      new Intl.DateTimeFormat('en', { timeZone: this.timezone });
    } catch {
      this.invalidZone.set(true);
      return;
    }
    this.invalidZone.set(false);
    this.preferences.update({ locale: { timezone: this.timezone } });
  }
  density(value: unknown): void {
    if (value === 'comfortable' || value === 'compact') {
      this.preferences.update({ appearance: { density: value } });
    }
  }
  numbering(value: unknown): void {
    if (value === 'latn' || value === 'arabext') {
      this.preferences.update({ locale: { numbering: value } });
    }
  }
  size(value: string): void {
    const size = Number(value);
    this.invalidSize.set(!Number.isInteger(size) || size < 1 || size > 100);
    if (!this.invalidSize()) {
      this.preferences.update({ workspace: { page_size: size } });
    }
  }
  landing(value: unknown): void {
    if (
      value === 'requests' ||
      value === 'work_items' ||
      value === 'studio' ||
      value === 'dashboard'
    ) {
      this.preferences.update({ workspace: { landing_key: value } });
    }
  }
  pageSize(event: Event): void {
    this.size((event.target as HTMLInputElement).value);
  }
  emailChange(event: Event): void {
    this.email((event.target as HTMLInputElement).checked);
  }
  email(value: boolean): void {
    this.preferences.update({ notifications: { email_enabled: value } });
  }
}
