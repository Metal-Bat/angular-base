import {
  CommandMenuItem,
  MenuButton,
} from '../../../../shared/ui/menu-button/menu-button';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { RouterLink } from '@angular/router';
import { EditorPort } from '../../application/workspace-ports';
import { FORM_RESOURCES } from '../../../forms/bindings';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
@Component({
  host: { class: 'console-fragment' },
  selector: 'app-request-actions',
  imports: [MenuButton, RouterLink, LocalizePipe, DialogModule],
  templateUrl: './request-actions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestActions {
  readonly editor =
    input.required<Pick<EditorPort, 'item' | 'busy' | 'blocked' | 'error'>>();
  readonly resources = inject(FORM_RESOURCES);
  private readonly locale = inject(Locale);
  private generation = 0;
  private readonly active = signal(true);
  readonly reportBusy = signal(false);
  readonly reportVisible = signal(false);
  private readonly menu = viewChild(MenuButton);
  closeReport(): void {
    this.reportVisible.set(false);
    this.generation++;
    this.reportBusy.set(false);
    this.menu()?.focus();
  }
  constructor() {
    const release = inject(ActorState).register(() => {
      this.active.set(false);
      this.generation++;
      this.reports.set([]);
      this.reportVisible.set(false);
      this.reportBusy.set(false);
    });
    inject(DestroyRef).onDestroy(() => {
      release();
      this.generation++;
      this.active.set(false);
    });
    effect(() => {
      void this.editor().item()?.ref;
      this.generation++;
      this.reports.set([]);
      this.reportVisible.set(false);
      this.reportBusy.set(false);
    });
  }
  readonly disabled = computed(
    () =>
      !this.active() ||
      !this.editor().item() ||
      this.reportBusy() ||
      this.editor().busy() ||
      this.editor().blocked() ||
      this.resources.transferBusy() ||
      !!this.resources.pendingAttachment(),
  );
  readonly commands = computed<readonly CommandMenuItem[]>(() => {
    const drafts: CommandMenuItem[] =
      this.editor().item()?.status === 'DRAFT'
        ? [
            {
              label: this.locale.text('Cancel draft'),
              command: (): void => {
                if (!this.disabled()) {
                  void this.resources.cancelRequest();
                }
              },
            },
            {
              label: this.locale.text('Resume presentation'),
              command: (): void => {
                if (!this.disabled()) {
                  void this.resources.resume();
                }
              },
            },
          ]
        : [];
    return [
      ...drafts,
      {
        label: this.locale.text('Request report'),
        command: (): void => {
          if (!this.disabled()) {
            void this.report();
          }
        },
      },
    ];
  });
  readonly reports = signal<readonly { reference: string; status: string }[]>(
    [],
  );
  async report(): Promise<void> {
    if (this.disabled()) {
      return;
    }
    const generation = this.generation;
    this.reportBusy.set(true);
    this.reportVisible.set(true);
    try {
      const reports = await this.resources.requestReport();
      if (this.active() && generation === this.generation) {
        this.reports.set(reports);
      }
    } finally {
      if (generation === this.generation) {
        this.reportBusy.set(false);
      }
    }
  }
}
