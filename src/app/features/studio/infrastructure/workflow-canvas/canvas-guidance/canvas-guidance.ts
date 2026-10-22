import { HelpPopover } from '../../../../../shared/ui/help-popover/help-popover';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LocalizePipe } from '../../../../../shared/ui/localize-pipe';
@Component({
  selector: 'app-canvas-guidance',
  imports: [HelpPopover, NgTemplateOutlet, LocalizePipe],
  templateUrl: './canvas-guidance.html',
  styleUrl: './canvas-guidance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasGuidance {
  readonly readOnly = input(false);
}
