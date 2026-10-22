import { constrainPopover, restorePopoverFocus } from '../anchored-popover';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { Popover, PopoverModule } from 'primeng/popover';
import { LocalizePipe } from '../localize-pipe';

/** Anchored frontend-owned guidance; consumers own the help content. */
@Component({
  selector: 'app-help-popover',
  imports: [ButtonDirective, PopoverModule, LocalizePipe],
  templateUrl: './help-popover.html',
  styleUrl: './help-popover.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpPopover {
  private static nextId = 0;
  readonly label = input('Help');
  readonly iconOnly = input(false);
  readonly id = 'context-help-' + ++HelpPopover.nextId;
  readonly opened = signal(false);
  private readonly trigger =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly popup = viewChild(Popover);
  private readonly close = viewChild<ElementRef<HTMLButtonElement>>('close');
  shown(): void {
    this.opened.set(true);
    constrainPopover(this.popup());
    this.close()?.nativeElement.focus({ preventScroll: true });
  }
  hidden(): void {
    this.opened.set(false);
    restorePopoverFocus(this.popup(), this.trigger()?.nativeElement);
  }
}
