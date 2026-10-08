import { ButtonDirective } from 'primeng/button';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { Feedback, fieldId } from '../../../core/feedback/feedback';
import { LocalizePipe } from '../localize-pipe';
@Component({
  host: { class: 'console-fragment' },
  selector: 'app-command-feedback',
  imports: [ButtonDirective, LocalizePipe],
  templateUrl: './command-feedback.html',
  styleUrl: './command-feedback.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandFeedback {
  readonly feedback = inject(Feedback);
  readonly fieldId = fieldId;
  private readonly dialog =
    viewChild<ElementRef<HTMLDialogElement>>('confirmation');
  private trigger: HTMLElement | null = null;
  constructor() {
    effect((): void => {
      const element = this.dialog()?.nativeElement;
      if (!element) {
        return;
      }
      if (this.feedback.confirmation() && !element.open) {
        this.trigger = element.ownerDocument.activeElement as HTMLElement;
        element.showModal();
      } else if (!this.feedback.confirmation() && element.open) {
        element.close();
        this.trigger?.focus();
        this.trigger = null;
      }
    });
  }
  cancel(event: Event): void {
    event.preventDefault();
    this.feedback.answer(false);
  }
}
