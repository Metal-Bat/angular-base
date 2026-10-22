import { ButtonDirective } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TaskFeedback } from '../task-feedback/task-feedback';
import { valueKinds, valueLabels } from '../../../forms/domain/value-labels';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import {
  CommandMenuItem,
  MenuButton,
} from '../../../../shared/ui/menu-button/menu-button';
import { ReferencePicker } from '../../../administration/presentation/reference-picker/reference-picker';
import { FORM_RESOURCES } from '../../../forms/bindings';
import { CaseFeedback } from '../../../forms/application/form-resources';
import { EditorPort } from '../../application/workspace-ports';
@Component({
  host: { class: 'console-fragment' },
  selector: 'app-advanced-task',
  imports: [
    ButtonDirective,
    FormsModule,
    LocalizePipe,
    TaskFeedback,
    DialogModule,
    ControlField,
    MenuButton,
    ReferencePicker,
  ],
  templateUrl: './advanced-task.html',
  styleUrl: './advanced-task.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedTask {
  readonly fieldRequested = output<Pick<CaseFeedback, 'scope' | 'item'>>();
  readonly editor = input.required<EditorPort>();
  readonly resources = inject(FORM_RESOURCES);
  private readonly actor = inject(ActorState);
  private readonly locale = inject(Locale);
  private readonly router = inject(Router);
  private readonly menu = viewChild(MenuButton);
  readonly picker = viewChild.required(ReferencePicker);
  readonly kinds = computed(() => {
    const document = this.editor().document();
    return document ? valueKinds(document.render) : {};
  });
  readonly labels = computed(() => {
    const document = this.editor().document();
    return document ? valueLabels(document.render) : {};
  });
  readonly feedback = signal<readonly CaseFeedback[]>([]);
  readonly feedbackExpanded = signal(false);
  readonly feedbackBusy = signal(false);
  readonly comment = signal('');
  readonly user = signal('');
  readonly group = signal('');
  readonly userLabel = signal('');
  readonly groupLabel = signal('');
  readonly reason = signal('');
  readonly error = signal('');
  readonly dialogTitle = computed(() =>
    this.dialog() === 'forward'
      ? 'Forward task'
      : this.dialog() === 'lifecycle'
        ? 'Close task lifecycle'
        : 'Add comment',
  );
  readonly dialog = signal<'comment' | 'forward' | 'lifecycle' | null>(null);
  readonly pending = signal(false);
  private generation = 0;
  readonly disabled = computed(
    () =>
      this.pending() ||
      this.editor().busy() ||
      this.editor().blocked() ||
      this.resources.transferBusy() ||
      !!this.resources.pendingAttachment(),
  );
  readonly canForward = computed(
    () =>
      this.editor().ownTask() && this.editor().item()?.kind === 'HUMAN_TASK',
  );
  readonly commands = computed<readonly CommandMenuItem[]>(() => [
    ...[
      ['Mark read', 'read', true],
      ['Mark unread', 'read', false],
      ['Pin', 'pin', true],
      ['Unpin', 'pin', false],
      ['Watch', 'watch', true],
      ['Unwatch', 'watch', false],
      ['Archive', 'archive', true],
      ['Unarchive', 'archive', false],
    ]
      .filter(([, action, value]) => {
        const current =
          this.editor().item()?.personal?.[
            action as 'read' | 'pin' | 'watch' | 'archive'
          ];
        return current === undefined
          ? action !== 'read' || value === true
          : current !== value;
      })
      .map(([label, action, value]) => ({
        label: this.locale.text(String(label)),
        command: (): void => {
          if (!this.disabled()) {
            void this.resources.personal(
              action as 'read' | 'pin' | 'watch' | 'archive',
              value as boolean,
            );
          }
        },
      })),
    {
      label: this.locale.text('Add comment'),
      command: (): void => this.open('comment'),
    },
    ...(!['COMPLETED', 'CANCELLED', 'EXPIRED', 'RETURNED', 'REJECTED'].includes(
      this.editor().item()?.status ?? '',
    )
      ? [
          {
            label: this.locale.text('Close task lifecycle'),
            command: (): void => this.open('lifecycle'),
          },
        ]
      : []),
    ...(this.canForward()
      ? [
          {
            label: this.locale.text('Forward task'),
            command: (): void => this.open('forward'),
          },
        ]
      : []),
  ]);
  constructor() {
    effect((onCleanup) => {
      const document = this.editor().document();
      let active = true;
      this.feedback.set([]);
      this.error.set('');
      this.feedbackBusy.set(!!document);
      if (document) {
        void this.resources
          .view()
          .then((feedback) => {
            if (active) {
              this.feedback.set(feedback);
              this.feedbackBusy.set(false);
            }
          })
          .catch((): void => {
            if (active) {
              this.feedbackBusy.set(false);
              this.error.set('The service is unavailable.');
            }
          });
      }
      onCleanup((): void => {
        active = false;
      });
    });
    effect(() => {
      this.editor().contextKey();
      this.reset();
      this.feedbackExpanded.set(false);
    });
    const release = this.actor.register(() => {
      this.reset();
      this.feedbackExpanded.set(false);
      this.feedbackBusy.set(false);
      this.feedback.set([]);
    });
    inject(DestroyRef).onDestroy(() => {
      this.reset();
      release();
    });
  }
  private reset(): void {
    this.generation++;
    this.dialog.set(null);
    this.comment.set('');
    this.reason.set('');
    this.user.set('');
    this.group.set('');
    this.userLabel.set('');
    this.groupLabel.set('');
    this.error.set('');
    this.pending.set(false);
  }
  open(kind: 'comment' | 'forward' | 'lifecycle'): void {
    if (this.disabled() || (kind === 'forward' && !this.canForward())) {
      return;
    }
    this.dialog.set(kind);
  }
  escape(event: Event): void {
    if (!event.defaultPrevented) {
      event.preventDefault();
      event.stopPropagation();
      void this.close();
    }
  }
  restoreFocus(): void {
    this.menu()?.focus();
  }
  readonly dirty = computed(
    () => !!(this.comment() || this.reason() || this.user() || this.group()),
  );
  async canLeave(): Promise<boolean> {
    return (
      !this.pending() &&
      !this.editor().busy() &&
      !this.resources.transferBusy() &&
      (!this.dirty() ||
        this.editor().feedback.confirm('Discard unsaved changes?'))
    );
  }
  async close(): Promise<void> {
    if (await this.canLeave()) {
      this.reset();
    }
  }
  pick(choice: { path: string; value: string; label: string }): void {
    if (this.disabled() || !this.canForward() || this.dialog() !== 'forward') {
      return;
    }
    if (choice.path === 'user_ref_id') {
      this.user.set(choice.value);
      this.userLabel.set(choice.label);
    }
    if (choice.path === 'work_group_ref_id') {
      this.group.set(choice.value);
      this.groupLabel.set(choice.label);
    }
  }
  async post(): Promise<void> {
    if (this.disabled() || !this.comment().trim()) {
      return;
    }
    const epoch = this.actor.epoch;
    const owner = this.editor().contextKey();
    const generation = this.generation;
    this.pending.set(true);
    try {
      const confirmed = await this.resources.comment(this.comment());
      if (
        epoch === this.actor.epoch &&
        generation === this.generation &&
        owner === this.editor().contextKey() &&
        confirmed
      ) {
        this.reset();
      }
    } finally {
      if (
        epoch === this.actor.epoch &&
        generation === this.generation &&
        owner === this.editor().contextKey()
      ) {
        this.pending.set(false);
      }
    }
  }
  async forward(): Promise<void> {
    if (
      this.disabled() ||
      !this.canForward() ||
      !this.reason().trim() ||
      (!this.user() && !this.group())
    ) {
      return;
    }
    const epoch = this.actor.epoch;
    const owner = this.editor().contextKey();
    const generation = this.generation;
    this.pending.set(true);
    try {
      const confirmed = await this.resources.forward(
        this.user() ? [this.user()] : [],
        this.group() ? [this.group()] : [],
        this.reason(),
      );
      if (
        epoch === this.actor.epoch &&
        generation === this.generation &&
        owner === this.editor().contextKey() &&
        confirmed
      ) {
        this.reset();
        await this.router.navigate(['/operations/tasks']);
      }
    } finally {
      if (
        epoch === this.actor.epoch &&
        generation === this.generation &&
        owner === this.editor().contextKey()
      ) {
        this.pending.set(false);
      }
    }
  }
  async resolve(key: string): Promise<void> {
    if (!this.disabled()) {
      await this.resources.resolveFeedback(key);
    }
  }
}
